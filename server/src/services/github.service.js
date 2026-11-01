const simpleGit = require('simple-git');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Commit = require('../models/Commit');
const { getEmbeddings, getSummary, summariseCommit, geminiChat } = require('./openai.service');
const { upsertEmbeddings, serializeNamespace } = require('./vector.service');

let octokitClient = null;
const getOctokit = () => {
  if (!octokitClient) {
    octokitClient = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || undefined,
    });
  }
  return octokitClient;
};

const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
];

/**
 * Check if a file should be processed
 */
const shouldProcessFile = (filePath) => {
  return !IGNORE_FILES.some((ignore) => filePath.includes(ignore));
};

/**
 * Recursively read all files from a directory
 */
const readAllFiles = (dir, baseDir = dir) => {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (!shouldProcessFile(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...readAllFiles(fullPath, baseDir));
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ source: relativePath, content });
      } catch {
        // Skip binary files
      }
    }
  }

  return files;
};

/**
 * Clone a GitHub repository and read all files
 */
const cloneAndReadRepo = async (githubUrl) => {
  // Use system temp dir to avoid OneDrive file locking issues on Windows
  const os = require('os');
  const tmpDir = path.join(os.tmpdir(), 'dionysus', `repo_${Date.now()}`);

  // Clean up if exists
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
  }

  const git = simpleGit();
  await git.clone(githubUrl, tmpDir);

  const files = readAllFiles(tmpDir);

  // Clean up cloned repo (retry on Windows file locks)
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
  } catch (err) {
    console.warn(`⚠️ Could not fully clean up temp dir: ${err.message}`);
  }

  return files;
};

/**
 * Generate a Mermaid graph from a list of file paths
 */
const generateFileTreeGraph = (filePaths, projectName = 'Repository') => {
  if (!filePaths || filePaths.length === 0) {
    return `graph TD;\n  root_0["📁 ${projectName}"]\n`;
  }

  const crypto = require('crypto');
  const safeId = (str) => 'n_' + crypto.createHash('md5').update(str).digest('hex').slice(0, 10);
  const rootId = 'root_dir';

  let graph = 'graph TD;\n';
  graph += `  classDef folder fill:#18181b,stroke:#3f3f46,stroke-width:1.5px,color:#e4e4e7,rx:6px,ry:6px;\n`;
  graph += `  classDef file fill:#0f1117,stroke:#27272a,stroke-width:1px,color:#a1a1aa,rx:4px,ry:4px;\n`;
  graph += `  classDef root fill:#18181b,stroke:#52525b,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;\n`;
  graph += `  ${rootId}["📁 ${projectName}"]:::root\n`;

  const createdNodes = new Set([rootId]);
  const createdEdges = new Set();

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let currentPath = '';
    let parentId = rootId;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const nodeId = safeId(currentPath);

      if (!createdNodes.has(nodeId)) {
        createdNodes.add(nodeId);
        const icon = isFile ? '📄 ' : '📁 ';
        const styleClass = isFile ? 'file' : 'folder';
        const safeLabel = (icon + part).replace(/["`]/g, '');
        graph += `  ${nodeId}["${safeLabel}"]:::${styleClass}\n`;
      }

      const edgeKey = `${parentId}->${nodeId}`;
      if (!createdEdges.has(edgeKey)) {
        createdEdges.add(edgeKey);
        graph += `  ${parentId} --> ${nodeId}\n`;
      }

      parentId = nodeId;
    }
  }

  return graph;
};

/**
 * Generate documentation by cloning repo, summarizing files, and storing embeddings
 */
const generateDocumentation = async (githubUrl) => {
  // 1. Clone and read repo
  const files = await cloneAndReadRepo(githubUrl);
  const filePaths = files.map((f) => f.source);
  const projectName = githubUrl.split('/').pop();
  const mermaidGraph = generateFileTreeGraph(filePaths, projectName);

  // Helper for batch processing with concurrency control
  const pMap = async (items, fn, concurrency = 5) => {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((item, idx) => fn(item, i + idx))
      );
      results.push(...chunkResults);
    }
    return results;
  };

  // 2. Prioritize key files for embedding and context (README, package.json, configs, main code files)
  const priorityKeywords = ['readme', 'package.json', 'index', 'app', 'main', 'server', 'config', 'route', 'controller', 'model'];
  const sortedFiles = [...files].sort((a, b) => {
    const aLower = a.source.toLowerCase();
    const bLower = b.source.toLowerCase();
    const aScore = priorityKeywords.reduce((acc, kw) => acc + (aLower.includes(kw) ? 2 : 0), 0);
    const bScore = priorityKeywords.reduce((acc, kw) => acc + (bLower.includes(kw) ? 2 : 0), 0);
    return bScore - aScore;
  });

  // Limit to top 10 key files to stay comfortably within free-tier rate limits
  const targetFiles = sortedFiles.slice(0, 10);

  // Generate lightweight summaries and embeddings for vector search
  const summaries = [];
  const embeddings = [];

  for (const file of targetFiles) {
    try {
      // First 300 words as summary to save tokens and prevent rate limit issues
      const quickSummary = file.content.slice(0, 500).replace(/\s+/g, ' ');
      summaries.push(quickSummary);
      const embedding = await getEmbeddings(`${file.source}: ${quickSummary}`);
      embeddings.push(embedding);
    } catch (err) {
      console.warn(`⚠️ Could not process ${file.source}: ${err.message}`);
      summaries.push(`File: ${file.source}`);
      embeddings.push(new Array(768).fill(0));
    }
  }

  // 3. Store vectors in Pinecone
  const namespace = serializeNamespace(githubUrl);
  const vectors = targetFiles.map((file, i) => ({
    content: file.content,
    values: embeddings[i],
    metadata: {
      source: file.source,
      code: file.content.slice(0, 10000),
      summary: summaries[i],
    },
  }));

  try {
    await upsertEmbeddings(namespace, vectors);
    console.log(`✓ Upserted ${vectors.length} vectors to Pinecone namespace "${namespace}"`);
  } catch (err) {
    console.warn(`⚠️ Pinecone upsert warning: ${err.message}`);
  }

  // 4. Generate all 12 documentation sections in ONE single structured LLM call
  const sections = [
    'Introduction',
    'Getting Started',
    'Repository',
    'Coding Standards',
    'Dependencies',
    'Building and Compiling',
    'Testing',
    'Contributing',
    'Issues',
    'Version Control',
    'CI/CD',
    'Documentation',
  ];

  const repoContext = targetFiles
    .map((f, i) => `--- File: ${f.source} ---\n${f.content.slice(0, 1500)}`)
    .join('\n\n')
    .slice(0, 10000);

  let sectionAnswers = {};
  try {
    const docPrompt = `You are a senior software engineer generating technical onboarding documentation for the project "${projectName}".
Below is the code and structure from the repository:
---
${repoContext}
---

Provide comprehensive, high-quality documentation for each of the following 12 sections:
${sections.join('\n')}

Respond ONLY with a valid JSON object where keys are the exact section names (without numbers) and values are detailed HTML formatted strings for each section.`;

    const rawJson = await geminiChat(
      'You are an expert technical writer. You must return ONLY a valid JSON object mapping section names to HTML content.',
      docPrompt
    );

    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      sectionAnswers = JSON.parse(jsonMatch[0]);
    } else {
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      sectionAnswers = JSON.parse(cleanJson);
    }
  } catch (err) {
    console.error('DOCUMENTATION ERROR:', err);
  }

  // Normalize section answers lookup (strips numbers, punctuation, casing)
  const normalize = (str) => str.toLowerCase().replace(/^[0-9]+[\.\-\s]+/, '').replace(/[^a-z0-9]/g, '');
  const normalizedAnswers = {};
  for (const [key, value] of Object.entries(sectionAnswers)) {
    normalizedAnswers[normalize(key)] = value;
  }

  let documentation = `<h1>${projectName} Documentation</h1>\n<p>Comprehensive onboarding and architectural guide for the <strong>${projectName}</strong> codebase.</p>\n\n`;

  sections.forEach((section) => {
    const id = section.toLowerCase().replace(/ /g, '-');
    let content =
      normalizedAnswers[normalize(section)] ||
      sectionAnswers[section] ||
      `<p>Details could not be automatically generated for this section.</p>`;

    // Remove any redundant top heading inside the section content to avoid double titles
    content = content.replace(
      new RegExp(`^\\s*<h[1-3][^>]*>.*?</h[1-3]>`, 'i'),
      ''
    ).trim();

    documentation += `<h2 id="${id}">${section}</h2>\n${content}\n\n`;
  });

  return { documentation, mermaidGraph };
};

/**
 * Fetch latest commit hashes from GitHub
 */
const getCommitHashes = async (githubUrl) => {
  const octokit = getOctokit();
  const parts = githubUrl.split('/');
  const owner = parts[3];
  const repo = parts[4];

  const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 15,
  });

  const sorted = data.sort(
    (a, b) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime()
  );

  return sorted.map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message || '',
    commitAuthorName: commit.commit?.author?.name || '',
    commitAuthorAvatar: commit.author?.avatar_url || '',
    commitDate: commit.commit?.author?.date || '',
  }));
};

/**
 * Poll a repo for new commits, summarize them, and store in DB
 */
const pollRepo = async (githubUrl, projectId) => {
  const commitHashes = await getCommitHashes(githubUrl);

  const existingCommits = await Commit.find({ project: projectId });
  const existingHashes = new Set(existingCommits.map((c) => c.commitHash));

  const newCommits = commitHashes.filter((c) => !existingHashes.has(c.commitHash));

  if (newCommits.length === 0) return [];

  // Summarize each new commit diff sequentially to respect API rate limits
  const summaries = [];
  for (const commit of newCommits) {
    try {
      const headers = {
        Accept: 'application/vnd.github.v3.diff',
      };
      if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
      }
      const response = await axios.get(
        `${githubUrl}/commit/${commit.commitHash}.diff`,
        { headers }
      );
      const diff = String(response.data).slice(0, 10000);
      const summary = await summariseCommit(diff);
      summaries.push({ status: 'fulfilled', value: summary });
    } catch (err) {
      console.error(`Failed to summarize commit ${commit.commitHash}:`, err.message);
      summaries.push({ status: 'rejected', reason: err });
    }
  }

  // Save to DB
  const commitDocs = newCommits.map((commit, idx) => ({
    project: projectId,
    commitHash: commit.commitHash,
    commitMessage: commit.commitMessage,
    commitAuthorName: commit.commitAuthorName,
    commitAuthorAvatar: commit.commitAuthorAvatar,
    commitDate: commit.commitDate,
    summary:
      summaries[idx].status === 'fulfilled'
        ? summaries[idx].value
        : 'Unable to summarize this commit.',
  }));

  const saved = await Commit.insertMany(commitDocs, { ordered: false }).catch(
    () => commitDocs
  );
  return saved;
};

/**
 * Helper to parse GitHub URL into owner and repo
 */
const parseGithubUrl = (githubUrl) => {
  if (!githubUrl) return null;
  const clean = githubUrl
    .trim()
    .replace(/\.git$/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^github\.com\//i, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return {
    owner: parts[0],
    repo: parts[1],
  };
};

/**
 * Fetch basic metadata for a repository
 */
const getRepoMetadata = async (owner, repo) => {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch || 'main',
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
  };
};

/**
 * Fetch repository recursive tree using GitHub Git Data API
 */
const fetchRepoTree = async (owner, repo, branch = null) => {
  const octokit = getOctokit();
  let targetBranch = branch;
  if (!targetBranch) {
    const meta = await getRepoMetadata(owner, repo);
    targetBranch = meta.defaultBranch;
  }

  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: targetBranch,
      recursive: '1',
    });

    if (!data || !data.tree) {
      return [];
    }

    return data.tree
      .filter((item) => item.type === 'blob')
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        size: item.size || 0,
      }));
  } catch (error) {
    console.warn(`⚠️ Git Tree API failed for ${owner}/${repo}: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch content of a single file from GitHub
 */
const fetchFileContent = async (owner, repo, filePath, branch = null) => {
  const octokit = getOctokit();
  try {
    const params = {
      owner,
      repo,
      path: filePath,
    };
    if (branch) params.ref = branch;

    const { data } = await octokit.rest.repos.getContent(params);

    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } else if (typeof data === 'string') {
      return data;
    } else if (data.download_url) {
      const resp = await axios.get(data.download_url, {
        headers: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}` }
          : {},
      });
      return typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
    }
    return '';
  } catch (error) {
    console.warn(`⚠️ Failed to fetch file ${filePath}: ${error.message}`);
    return null;
  }
};

/**
 * Fetch multiple files concurrently with rate limit and concurrency control
 */
const fetchBatchFileContents = async (owner, repo, filePaths, branch = null, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const chunk = filePaths.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (filePath) => {
        const content = await fetchFileContent(owner, repo, filePath, branch);
        return { source: filePath, content };
      })
    );
    results.push(...chunkResults.filter((r) => r.content !== null));
  }
  return results;
};
module.exports = {
  parseGithubUrl,
  getRepoMetadata,
  fetchRepoTree,
  fetchFileContent,
  fetchBatchFileContents,
  IGNORE_FILES,
  shouldProcessFile,
  cloneAndReadRepo,
  generateFileTreeGraph,
  generateDocumentation,
  getCommitHashes,
  pollRepo,
};

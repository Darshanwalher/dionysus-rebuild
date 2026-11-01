const Project = require('../models/Project');
const {
  parseGithubUrl,
  getRepoMetadata,
  fetchRepoTree,
  fetchBatchFileContents,
  cloneAndReadRepo,
  shouldProcessFile,
} = require('../services/github.service');
const { generateArchitecture: buildArchitecture } = require('../services/architecture.service');
const { buildDependencyGraph } = require('../services/dependency-graph.service');

/**
 * Helper to obtain repository files either via Octokit API or local clone fallback
 */
const getRepositoryFiles = async (githubUrl) => {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;
  let files = [];
  let repoMetadata = { name: repo, owner };

  try {
    // 1. Try fast GitHub Git Tree API first
    repoMetadata = await getRepoMetadata(owner, repo);
    const tree = await fetchRepoTree(owner, repo, repoMetadata.defaultBranch);

    // Filter out node_modules, dist, locks, etc.
    const relevantPaths = tree
      .map((item) => item.path)
      .filter((p) => shouldProcessFile(p));

    // Limit to reasonable batch (top 200 files) to stay within GitHub API limits
    const targetPaths = relevantPaths.slice(0, 200);

    files = await fetchBatchFileContents(owner, repo, targetPaths, repoMetadata.defaultBranch, 5);

    if (files.length === 0) {
      throw new Error('No readable files retrieved via GitHub API');
    }
  } catch (apiError) {
    console.warn(`⚠️ GitHub API fetch failed or rate-limited (${apiError.message}), falling back to git clone...`);
    // Fallback to cloneAndReadRepo (clones into temp dir and reads all files)
    files = await cloneAndReadRepo(githubUrl);
  }

  return { files, repoMetadata };
};

// @desc    Generate or retrieve architecture diagram for a project's repo
// @route   POST /api/github/:id/architecture
const generateArchitecture = async (req, res, next) => {
  try {
    const { force = false } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    // Return cached architecture if available and not forced
    if (project.architectureGraph && !force) {
      return res.json({
        success: true,
        data: project.architectureGraph,
        isCached: true,
      });
    }

    const { files, repoMetadata } = await getRepositoryFiles(project.githubUrl);

    // Generate architecture diagram using Gemini AI
    const architectureGraph = await buildArchitecture(files, repoMetadata);

    project.architectureGraph = architectureGraph;
    await project.save();

    res.json({
      success: true,
      data: architectureGraph,
      isCached: false,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate or retrieve source dependency graph for a project's repo
// @route   POST /api/github/:id/dependencies
const generateDependencies = async (req, res, next) => {
  try {
    const { force = false } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    // Return cached dependencies if available and not forced
    if (project.dependencyGraph && !force) {
      return res.json({
        success: true,
        data: project.dependencyGraph,
        isCached: true,
      });
    }

    const { files } = await getRepositoryFiles(project.githubUrl);

    // Build static deterministic dependency graph
    const dependencyGraph = buildDependencyGraph(files);

    project.dependencyGraph = dependencyGraph;
    await project.save();

    res.json({
      success: true,
      data: dependencyGraph,
      isCached: false,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get repository analysis status and statistics
// @route   GET /api/github/:id/analysis
const getAnalysis = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: {
        githubUrl: project.githubUrl,
        hasArchitecture: !!project.architectureGraph,
        hasDependencies: !!project.dependencyGraph,
        architectureMetadata: project.architectureGraph?.metadata || null,
        dependencyStatistics: project.dependencyGraph?.statistics || null,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh repository analysis (architecture, dependencies, or both)
// @route   POST /api/github/:id/analysis/refresh
const refreshAnalysis = async (req, res, next) => {
  try {
    const { type = 'all' } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (!project.githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'No GitHub repository linked to this project',
      });
    }

    const { files, repoMetadata } = await getRepositoryFiles(project.githubUrl);

    if (type === 'architecture' || type === 'all') {
      project.architectureGraph = await buildArchitecture(files, repoMetadata);
    }

    if (type === 'dependencies' || type === 'all') {
      project.dependencyGraph = buildDependencyGraph(files);
    }

    await project.save();

    res.json({
      success: true,
      message: `Analysis refreshed successfully (${type})`,
      data: {
        architecture: project.architectureGraph,
        dependencies: project.dependencyGraph,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateArchitecture,
  generateDependencies,
  getAnalysis,
  refreshAnalysis,
};


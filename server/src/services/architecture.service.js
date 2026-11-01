const { geminiChat } = require('./openai.service');
const { validateArchitectureGraph, createFallbackArchitecture } = require('./graph-validator.service');

/**
 * Filter and prioritize files for architecture analysis
 */
const prepareArchitectureContext = (files = [], repoMetadata = {}) => {
  const priorityPatterns = [
    { pattern: /readme/i, score: 25 },
    { pattern: /package\.json$/i, score: 20 },
    { pattern: /docker-compose|dockerfile/i, score: 15 },
    { pattern: /(app|index|main|server)\.(jsx?|tsx?|ts|js|py|go)/i, score: 18 },
    { pattern: /(route|router|controller|api)/i, score: 14 },
    { pattern: /(model|schema|entity)/i, score: 12 },
    { pattern: /(service|provider|usecase|client)/i, score: 12 },
    { pattern: /(store|context|redux|state)/i, score: 10 },
    { pattern: /(middleware|auth|security)/i, score: 10 },
    { pattern: /(config|env|settings)/i, score: 8 },
    { pattern: /(view|page|component)/i, score: 6 },
  ];

  // Score and sort files
  const scoredFiles = files.map((file) => {
    const src = file.source.toLowerCase();
    let score = 0;
    for (const { pattern, score: pts } of priorityPatterns) {
      if (pattern.test(src)) {
        score += pts;
      }
    }
    return { ...file, score };
  });

  scoredFiles.sort((a, b) => b.score - a.score);

  // Take top ~20 most architecturally significant files
  const topFiles = scoredFiles.slice(0, 20);

  // File tree summary (max 100 paths)
  const fileTreeSummary = files
    .slice(0, 100)
    .map((f) => f.source)
    .join('\n');

  // Build snippet block
  let snippetBlock = '';
  let tokenBudget = 14000; // character budget

  for (const f of topFiles) {
    if (tokenBudget <= 0) break;
    const isReadmeOrPkg = /readme|package\.json/i.test(f.source);
    const maxChars = isReadmeOrPkg ? 2000 : 800;
    const snippet = (f.content || '').slice(0, maxChars).trim();
    if (snippet) {
      const part = `\n--- File: ${f.source} ---\n${snippet}\n`;
      tokenBudget -= part.length;
      snippetBlock += part;
    }
  }

  return {
    projectName: repoMetadata.name || 'Repository',
    description: repoMetadata.description || '',
    language: repoMetadata.language || 'Multi-language',
    fileTreeSummary,
    snippetBlock,
    totalFiles: files.length,
  };
};

/**
 * Generate AI-powered architecture graph using Gemini
 */
const generateArchitecture = async (files = [], repoMetadata = {}) => {
  const context = prepareArchitectureContext(files, repoMetadata);

  const systemPrompt = `You are a Principal Software Architect.
Your task is to analyze the repository structure and source code to produce a GitDiagram-style high-level architecture diagram.
You must categorize components into meaningful groups based on the actual repository architecture (e.g. "Frontend", "Backend", "API Layer", "Authentication", "Database", "AI Services", "External Integrations", etc. - derive groups from reality, do not force artificial categories).
You MUST respond with ONLY a valid, parseable JSON object without markdown code blocks, explanation, or commentary.`;

  const userPrompt = `Project: ${context.projectName}
Description: ${context.description}
Language: ${context.language}
Total Files: ${context.totalFiles}

File Structure Snapshot:
${context.fileTreeSummary}

Key Architectural Files and Headers:
${context.snippetBlock}

Generate a comprehensive architecture graph JSON matching this exact structure:
{
  "metadata": {
    "architecturalStyle": "e.g. Microservices, Full-Stack Monorepo, Jamstack, Event-Driven",
    "summary": "Brief 1-2 sentence overview of the architecture"
  },
  "groups": [
    {
      "id": "unique_group_id_lowercase",
      "label": "Human Readable Group Name",
      "description": "Short explanation of group's purpose"
    }
  ],
  "nodes": [
    {
      "id": "unique_node_id_lowercase",
      "label": "Clear Component Name",
      "type": "component | controller | service | model | middleware | route | database | external | worker",
      "path": "relative/file/or/folder/path",
      "group": "matching_group_id",
      "description": "Short explanation of what this component does",
      "responsibility": "Primary responsibility"
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "e.g. HTTP Request, API Call, Imports, Database Query, AI Processing, Event",
      "type": "api | import | database | auth | event | data_flow"
    }
  ]
}

Ensure:
1. Every edge references valid source and target node ids.
2. Group ids in nodes match defined group ids.
3. Every major system boundary is captured.
4. Output MUST BE ONLY raw JSON.`;

  try {
    const rawResult = await geminiChat(systemPrompt, userPrompt);
    let parsed = null;

    // Try finding JSON object in output
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        // Clean markdown backticks and try again
        const cleanJson = rawResult
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        parsed = JSON.parse(cleanJson);
      }
    } else {
      const cleanJson = rawResult
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    }

    return validateArchitectureGraph(parsed, context.projectName);
  } catch (error) {
    console.error('⚠️ Architecture AI generation failed, using fallback:', error.message);
    return createFallbackArchitecture(context.projectName);
  }
};

module.exports = {
  prepareArchitectureContext,
  generateArchitecture,
};


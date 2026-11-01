const path = require('path');
const { analyzeFile, isAnalyzableFile } = require('./code-analyzer.service');

/**
 * Detect all circular dependencies in an edge list using DFS
 */
const detectCircularDependencies = (nodes, edges) => {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((edge) => {
    if (adj.has(edge.source) && adj.has(edge.target)) {
      adj.get(edge.source).push(edge.target);
    }
  });

  const visited = new Map(); // 0 = unvisited, 1 = visiting (in stack), 2 = visited
  nodes.forEach((n) => visited.set(n.id, 0));

  const cycles = [];
  const currentPath = [];

  const dfs = (u) => {
    visited.set(u, 1);
    currentPath.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (visited.get(v) === 1) {
        // Found a cycle!
        const cycleStartIndex = currentPath.indexOf(v);
        const cycle = currentPath.slice(cycleStartIndex).concat(v);
        cycles.push(cycle);
      } else if (visited.get(v) === 0) {
        dfs(v);
      }
    }

    currentPath.pop();
    visited.set(u, 2);
  };

  for (const node of nodes) {
    if (visited.get(node.id) === 0) {
      dfs(node.id);
    }
  }

  // Deduplicate and format cycles
  const formattedCycles = [];
  const seenCycleSignatures = new Set();

  for (const cycle of cycles) {
    // Normalise cycle signature so A->B->A is same regardless of start
    const cycleNodesWithoutLast = cycle.slice(0, -1);
    const minNode = [...cycleNodesWithoutLast].sort()[0];
    const minIdx = cycleNodesWithoutLast.indexOf(minNode);
    const normalized = [
      ...cycleNodesWithoutLast.slice(minIdx),
      ...cycleNodesWithoutLast.slice(0, minIdx),
      minNode,
    ];
    const signature = normalized.join(' -> ');

    if (!seenCycleSignatures.has(signature)) {
      seenCycleSignatures.add(signature);
      formattedCycles.push({
        path: signature,
        nodes: normalized,
        length: normalized.length - 1,
      });
    }
  }

  return formattedCycles;
};

/**
 * Build a deterministic dependency graph from repository files
 * @param {Array<{ source: string, content: string }>} files
 */
const buildDependencyGraph = (files = []) => {
  const analyzableFiles = files.filter((f) => isAnalyzableFile(f.source));
  const allFilePaths = new Set(files.map((f) => f.source));

  // Run static analysis on each file
  const analysisResults = analyzableFiles.map((file) => {
    const analysis = analyzeFile(file.content, file.source, allFilePaths);
    return {
      file,
      analysis,
    };
  });

  const incomingCounts = new Map();
  const outgoingCounts = new Map();
  analyzableFiles.forEach((f) => {
    incomingCounts.set(f.source, 0);
    outgoingCounts.set(f.source, 0);
  });

  const rawEdges = [];
  const edgeSet = new Set();

  for (const { file, analysis } of analysisResults) {
    const sourcePath = file.source;

    for (const imp of analysis.imports) {
      if (imp.isInternal && imp.resolvedPath && imp.resolvedPath !== sourcePath) {
        const targetPath = imp.resolvedPath;
        const edgeKey = `${sourcePath}===>${targetPath}`;

        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          rawEdges.push({
            id: `edge_${sourcePath.replace(/[^a-zA-Z0-9]/g, '_')}_to_${targetPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
            source: sourcePath,
            target: targetPath,
            type: imp.type,
            symbols: imp.symbols,
          });

          outgoingCounts.set(sourcePath, (outgoingCounts.get(sourcePath) || 0) + 1);
          incomingCounts.set(targetPath, (incomingCounts.get(targetPath) || 0) + 1);
        }
      }
    }
  }

  // Create nodes
  const nodes = analysisResults.map(({ file, analysis }) => {
    const ext = path.extname(file.source).toLowerCase();
    const dir = path.dirname(file.source).replace(/\\/g, '/');
    const label = path.basename(file.source);
    const inCount = incomingCounts.get(file.source) || 0;
    const outCount = outgoingCounts.get(file.source) || 0;

    return {
      id: file.source,
      label,
      path: file.source,
      extension: ext,
      directory: dir === '.' ? 'root' : dir,
      incomingCount: inCount,
      outgoingCount: outCount,
      totalConnections: inCount + outCount,
      exports: analysis.exports.map((e) => e.symbol),
      size: file.content ? file.content.length : 0,
    };
  });

  // Cycle detection
  const circulars = detectCircularDependencies(nodes, rawEdges);
  const circularNodeIds = new Set();
  circulars.forEach((c) => c.nodes.forEach((n) => circularNodeIds.add(n)));

  // Annotate nodes with circular flag
  nodes.forEach((n) => {
    n.isCircular = circularNodeIds.has(n.id);
  });

  // Annotate edges with circular flag
  const edges = rawEdges.map((e) => ({
    ...e,
    isCircular: circularNodeIds.has(e.source) && circularNodeIds.has(e.target),
  }));

  // Identify isolated and highly connected files
  const isolatedFiles = nodes.filter((n) => n.incomingCount === 0 && n.outgoingCount === 0);
  const highlyConnected = [...nodes]
    .sort((a, b) => b.totalConnections - a.totalConnections)
    .slice(0, 10);

  // Available filters
  const directories = Array.from(new Set(nodes.map((n) => n.directory))).sort();
  const extensions = Array.from(new Set(nodes.map((n) => n.extension))).sort();

  const statistics = {
    totalFiles: nodes.length,
    totalDependencies: edges.length,
    circularDependencies: circulars.length,
    isolatedFiles: isolatedFiles.length,
    avgDependenciesPerFile: nodes.length > 0 ? +(edges.length / nodes.length).toFixed(2) : 0,
    mostConnectedFile: highlyConnected.length > 0 ? highlyConnected[0].path : null,
    circularDetails: circulars,
  };

  return {
    nodes,
    edges,
    statistics,
    filters: {
      directories,
      extensions,
    },
  };
};

module.exports = {
  detectCircularDependencies,
  buildDependencyGraph,
};


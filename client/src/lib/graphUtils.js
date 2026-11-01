import dagre from "@dagrejs/dagre";

/**
 * Determine the architectural tier of a group for natural vertical hierarchy
 */
const getGroupTier = (groupId = "", groupLabel = "") => {
  const str = `${groupId} ${groupLabel}`.toLowerCase();
  if (str.includes("frontend") || str.includes("client") || str.includes("ui") || str.includes("presentation") || str.includes("view")) {
    return 0; // Top tier
  }
  if (str.includes("api") || str.includes("gateway") || str.includes("route")) {
    return 1; // API Layer
  }
  if (str.includes("backend") || str.includes("server") || str.includes("controller") || str.includes("service") || str.includes("business") || str.includes("auth")) {
    return 2; // Business logic / Backend
  }
  if (str.includes("database") || str.includes("db") || str.includes("model") || str.includes("data") || str.includes("storage")) {
    return 3; // Database / Persistence
  }
  if (str.includes("ai") || str.includes("external") || str.includes("third") || str.includes("worker") || str.includes("background")) {
    return 4; // External services / Workers
  }
  return 2;
};

/**
 * GitDiagram-Style Group-Clustered Architecture Layout
 * Creates visual group containers with multi-column internal node grids
 */
export const layoutArchitectureDiagram = (rawNodes = [], rawEdges = [], direction = "TB") => {
  if (!rawNodes || rawNodes.length === 0) {
    return { nodes: [], edges: [], initialNodes: [], initialEdges: [] };
  }

  const isHorizontal = direction === "LR";
  const NODE_WIDTH = 270;
  const NODE_HEIGHT = 105;
  const PADDING_X = 24;
  const PADDING_TOP = 52; // Room for group header
  const PADDING_BOTTOM = 24;
  const GAP_X = 20;
  const GAP_Y = 18;

  // 1. Group nodes by their group ID
  const groupBuckets = new Map();
  const groupLabels = new Map();

  rawNodes.forEach((node) => {
    const groupId = node.data?.group || "default";
    const groupLabel = node.data?.groupLabel || groupId;
    if (!groupBuckets.has(groupId)) {
      groupBuckets.set(groupId, []);
      groupLabels.set(groupId, groupLabel);
    }
    groupBuckets.get(groupId).push(node);
  });

  // 2. Sort groups by tier
  const sortedGroupIds = Array.from(groupBuckets.keys()).sort((a, b) => {
    const tierA = getGroupTier(a, groupLabels.get(a));
    const tierB = getGroupTier(b, groupLabels.get(b));
    return tierA - tierB;
  });

  // 3. For each group, calculate internal grid dimensions
  const groupBoxes = new Map();
  const placedNodes = [];

  sortedGroupIds.forEach((groupId) => {
    const nodesInGroup = groupBuckets.get(groupId) || [];
    const count = nodesInGroup.length;

    // Pick 2 or 3 columns based on count to keep it compact
    let cols = 2;
    if (count >= 5) cols = 3;
    if (count <= 1) cols = 1;

    const rows = Math.ceil(count / cols);
    const groupWidth = PADDING_X * 2 + cols * NODE_WIDTH + (cols - 1) * GAP_X;
    const groupHeight = PADDING_TOP + PADDING_BOTTOM + rows * NODE_HEIGHT + (rows - 1) * GAP_Y;

    groupBoxes.set(groupId, {
      id: `group_${groupId}`,
      groupId,
      label: groupLabels.get(groupId),
      width: groupWidth,
      height: groupHeight,
      cols,
      rows,
      nodes: nodesInGroup,
    });
  });

  // 4. Lay out the group containers using Dagre
  const groupGraph = new dagre.graphlib.Graph();
  groupGraph.setDefaultEdgeLabel(() => ({}));
  groupGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 60 : 70,
    ranksep: isHorizontal ? 80 : 70,
    marginx: 50,
    marginy: 50,
  });

  sortedGroupIds.forEach((groupId) => {
    const box = groupBoxes.get(groupId);
    if (box) {
      groupGraph.setNode(box.id, { width: box.width, height: box.height });
    }
  });

  // Add inter-group edges to dagre to respect natural data flow
  (rawEdges || []).forEach((edge) => {
    const sourceNode = rawNodes.find((n) => n.id === edge.source);
    const targetNode = rawNodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode && sourceNode.data?.group !== targetNode.data?.group) {
      const srcGroupId = `group_${sourceNode.data?.group || "default"}`;
      const tgtGroupId = `group_${targetNode.data?.group || "default"}`;
      if (groupGraph.hasNode(srcGroupId) && groupGraph.hasNode(tgtGroupId)) {
        groupGraph.setEdge(srcGroupId, tgtGroupId);
      }
    }
  });

  try {
    dagre.layout(groupGraph);
  } catch (err) {
    console.warn("Dagre layout error:", err);
  }

  // 5. Generate final container nodes and place child nodes inside
  const finalGroupNodes = [];

  sortedGroupIds.forEach((groupId) => {
    const box = groupBoxes.get(groupId);
    if (!box) return;

    const dagreNode = groupGraph.node(box.id);
    const groupX = dagreNode ? dagreNode.x - box.width / 2 : 0;
    const groupY = dagreNode ? dagreNode.y - box.height / 2 : 0;

    // Create the container backdrop node
    finalGroupNodes.push({
      id: box.id,
      type: "groupNode",
      position: { x: groupX, y: groupY },
      draggable: false,
      selectable: false,
      zIndex: -1,
      data: {
        id: box.groupId,
        label: box.label,
        width: box.width,
        height: box.height,
        count: box.nodes.length,
      },
    });

    // Position each child node inside this group box
    box.nodes.forEach((node, idx) => {
      const col = idx % box.cols;
      const row = Math.floor(idx / box.cols);

      const nodeX = groupX + PADDING_X + col * (NODE_WIDTH + GAP_X);
      const nodeY = groupY + PADDING_TOP + row * (NODE_HEIGHT + GAP_Y);

      placedNodes.push({
        ...node,
        targetPosition: isHorizontal ? "left" : "top",
        sourcePosition: isHorizontal ? "right" : "bottom",
        position: { x: nodeX, y: nodeY },
      });
    });
  });

  const allNodes = [...finalGroupNodes, ...placedNodes];

  return {
    nodes: allNodes,
    edges: rawEdges,
    initialNodes: allNodes,
    initialEdges: rawEdges,
  };
};

/**
 * High-performance hierarchical layout for Dependency Graph
 * Uses Dagre with tiering and compact ranks to prevent giant horizontal sprawl
 */
export const layoutDependencyGraph = (nodes = [], edges = [], direction = "LR") => {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [], initialNodes: [], initialEdges: [] };
  }

  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 260;
  const nodeHeight = 85;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 35,
    ranksep: 55,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  (edges || []).forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);
  } catch (err) {
    console.warn("Dagre dependency layout error:", err);
  }

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: pos ? pos.x - nodeWidth / 2 : 0,
        y: pos ? pos.y - nodeHeight / 2 : 0,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
    initialNodes: layoutedNodes,
    initialEdges: edges,
  };
};

/**
 * Export graph as JSON file download
 */
export const exportGraphAsJSON = (graphData, fileName = "dionysus-graph.json") => {
  if (!graphData) return;
  const jsonString = JSON.stringify(graphData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

import dagre from "@dagrejs/dagre";

/**
 * Automatically layout nodes and edges using Dagre hierarchical graph layout
 * @param {Array} nodes
 * @param {Array} edges
 * @param {string} direction - 'TB' (top-to-bottom) or 'LR' (left-to-right)
 * @param {Object} options
 */
export const getLayoutedElements = (nodes, edges, direction = "TB", options = {}) => {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = options.nodeWidth || (isHorizontal ? 260 : 240);
  const nodeHeight = options.nodeHeight || 110;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: options.nodesep || 50,
    ranksep: options.ranksep || 70,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    // If it's a group node, give it larger boundaries or compute from children
    const width = node.data?.isGroup ? 400 : (node.width || nodeWidth);
    const height = node.data?.isGroup ? 300 : (node.height || nodeHeight);
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.width || nodeWidth;
    const height = node.height || nodeHeight;

    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
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

/**
 * Export SVG element from DOM
 */
export const exportSVGElement = (svgElement, fileName = "dionysus-diagram.svg") => {
  if (!svgElement) return;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ArchitectureNode from "./nodes/ArchitectureNode";
import GraphControls from "./panels/GraphControls";
import GraphStats from "./panels/GraphStats";
import NodeDetailPanel from "./panels/NodeDetailPanel";
import { getLayoutedElements, exportGraphAsJSON } from "@/lib/graphUtils";
import { getEdgeStyle } from "@/lib/graphStyles";
import { toast } from "sonner";
import { RefreshCw, Boxes, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

function ArchitectureOverviewFlow({
  architectureData,
  githubUrl,
  isLoading,
  error,
  onRefresh,
  isFullscreen,
}) {
  const reactFlowWrapper = useRef(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [direction, setDirection] = useState("TB");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Transform raw architecture graph into React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!architectureData || !architectureData.nodes) {
      return { initialNodes: [], initialEdges: [] };
    }

    const groupMap = new Map();
    (architectureData.groups || []).forEach((g) => {
      groupMap.set(g.id, g.label || g.name || g.id);
    });

    const flowNodes = architectureData.nodes.map((node) => ({
      id: node.id,
      type: "architectureNode",
      data: {
        ...node,
        groupLabel: groupMap.get(node.group) || node.group,
        targetPosition: direction === "LR" ? "left" : "top",
        sourcePosition: direction === "LR" ? "right" : "bottom",
      },
      position: { x: 0, y: 0 },
    }));

    const flowEdges = (architectureData.edges || []).map((edge) => {
      const edgeStyle = getEdgeStyle(edge.type);
      return {
        id: edge.id || `e_${edge.source}_${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || "",
        animated: edgeStyle.animated,
        style: {
          stroke: edgeStyle.stroke,
          strokeWidth: edgeStyle.strokeWidth,
          strokeDasharray: edgeStyle.strokeDasharray,
        },
        labelStyle: {
          fill: "var(--foreground)",
          fontSize: 10,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "var(--card)",
          fillOpacity: 0.9,
          stroke: "var(--border)",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        data: edge,
      };
    });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [architectureData, direction]);

  // Apply Dagre layout
  useEffect(() => {
    if (initialNodes.length === 0) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      direction,
      { nodeWidth: 280, nodeHeight: 120 }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [initialNodes, initialEdges, direction, setNodes, setEdges, fitView]);

  // Track zoom level changes
  const onMoveEnd = useCallback((event, viewport) => {
    if (viewport && typeof viewport.zoom === "number") {
      setZoomLevel(viewport.zoom);
    }
  }, []);

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return nodes;

    return nodes.map((node) => {
      const match =
        node.data.label?.toLowerCase().includes(q) ||
        node.data.path?.toLowerCase().includes(q) ||
        node.data.description?.toLowerCase().includes(q) ||
        node.data.groupLabel?.toLowerCase().includes(q);

      return {
        ...node,
        style: {
          ...node.style,
          opacity: match ? 1 : 0.2,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [nodes, searchTerm]);

  // Highlight connections when node is selected
  const styledEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    return edges.map((edge) => {
      const isConnected = edge.source === selectedNodeId || edge.target === selectedNodeId;
      const baseStyle = getEdgeStyle(edge.data?.type, isConnected);

      return {
        ...edge,
        animated: isConnected ? true : baseStyle.animated,
        style: {
          ...edge.style,
          stroke: isConnected ? "#f59e0b" : baseStyle.stroke,
          strokeWidth: isConnected ? 2.5 : baseStyle.strokeWidth,
          opacity: isConnected ? 1 : 0.25,
        },
      };
    });
  }, [edges, selectedNodeId]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleResetView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleExportSVG = () => {
    if (!reactFlowWrapper.current) return;
    const svgEl = reactFlowWrapper.current.querySelector(".react-flow__viewport");
    if (!svgEl) {
      toast.error("Could not capture diagram view");
      return;
    }
    // Create an SVG wrapper
    const bbox = reactFlowWrapper.current.getBoundingClientRect();
    const serializer = new XMLSerializer();
    const content = serializer.serializeToString(svgEl);
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}">${content}</svg>`;
    const blob = new Blob([fullSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture-overview.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Architecture diagram exported as SVG!");
  };

  const handleExportJSON = () => {
    exportGraphAsJSON(architectureData, "architecture-graph.json");
    toast.success("Architecture graph exported as JSON!");
  };

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  if (isLoading && (!architectureData || !architectureData.nodes)) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[500px]">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
        <div className="text-center">
          <h4 className="text-sm font-semibold text-foreground">Analyzing Architecture</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Dionysus AI is inspecting repository modules, APIs, services, and relationships...
          </p>
        </div>
      </div>
    );
  }

  if (error && (!architectureData || !architectureData.nodes)) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 min-h-[450px]">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h4 className="text-sm font-semibold text-foreground">Failed to Generate Architecture</h4>
        <p className="text-xs text-muted-foreground text-center max-w-md">{error}</p>
        <Button variant="outline" size="sm" onClick={() => onRefresh(true)} className="mt-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!architectureData || !architectureData.nodes || architectureData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 min-h-[450px]">
        <Boxes className="h-10 w-10 text-muted-foreground opacity-60" />
        <h4 className="text-sm font-semibold text-foreground">No Architecture Generated</h4>
        <p className="text-xs text-muted-foreground text-center max-w-md">
          Click generate to analyze this repository's architectural structure.
        </p>
        <Button variant="default" size="sm" onClick={() => onRefresh(true)} className="mt-2 text-xs">
          Generate Architecture
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col w-full"
      style={{ height: isFullscreen ? "calc(100vh - 120px)" : "680px" }}
      ref={reactFlowWrapper}
    >
      {/* Controls Bar */}
      <GraphControls
        zoom={zoomLevel}
        onZoomIn={() => zoomIn({ duration: 200 })}
        onZoomOut={() => zoomOut({ duration: 200 })}
        onFitView={() => fitView({ padding: 0.2, duration: 300 })}
        onResetView={handleResetView}
        direction={direction}
        onToggleDirection={(d) => setDirection(d)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        onExportSVG={handleExportSVG}
        onExportJSON={handleExportJSON}
        onRefresh={() => onRefresh(true)}
        isLoading={isLoading}
        placeholder="Filter architecture components..."
      />

      {/* Stats Bar */}
      <GraphStats
        mode="architecture"
        stats={{
          nodeCount: architectureData.nodes?.length || 0,
          edgeCount: architectureData.edges?.length || 0,
          groupCount: architectureData.groups?.length || 0,
        }}
        metadata={architectureData.metadata || {}}
      />

      {/* React Flow Canvas */}
      <div className="relative flex-1 w-full h-full bg-background/50">
        <ReactFlow
          nodes={filteredNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onMoveEnd={onMoveEnd}
          minZoom={0.15}
          maxZoom={2.5}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={20} size={1} />
          <Controls showInteractive={false} className="!border-border/60 !bg-card !shadow-md" />
          {showMinimap && (
            <MiniMap
              nodeStrokeColor="#71717a"
              nodeColor="#27272a"
              nodeBorderRadius={6}
              className="!border-border/60 !bg-card/90 !rounded-lg !shadow-lg"
            />
          )}
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            allNodes={nodes}
            allEdges={edges}
            mode="architecture"
            githubUrl={githubUrl}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={(id) => setSelectedNodeId(id)}
          />
        )}
      </div>
    </div>
  );
}

export default function ArchitectureOverview(props) {
  return (
    <ReactFlowProvider>
      <ArchitectureOverviewFlow {...props} />
    </ReactFlowProvider>
  );
}

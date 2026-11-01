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
import { RefreshCw, Boxes, AlertCircle, Sparkles } from "lucide-react";
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
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const [direction, setDirection] = useState("TB");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
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
        type: "smoothstep",
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
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: "color-mix(in oklch, var(--card) 95%, transparent)",
          fillOpacity: 0.95,
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
      { nodeWidth: 290, nodeHeight: 130, nodesep: 50, ranksep: 80 }
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

  // Filter nodes based on search query AND active group
  const filteredNodes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return nodes.map((node) => {
      const matchSearch =
        !q ||
        node.data.label?.toLowerCase().includes(q) ||
        node.data.path?.toLowerCase().includes(q) ||
        node.data.description?.toLowerCase().includes(q) ||
        node.data.groupLabel?.toLowerCase().includes(q);

      const matchGroup =
        activeGroup === "all" ||
        node.data.group === activeGroup ||
        node.data.groupLabel?.toLowerCase() === activeGroup.toLowerCase();

      const isVisible = matchSearch && matchGroup;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isVisible ? 1 : 0.15,
          transition: "opacity 0.25s ease, filter 0.25s ease",
          filter: isVisible ? "none" : "grayscale(80%)",
        },
      };
    });
  }, [nodes, searchTerm, activeGroup]);

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
          opacity: isConnected ? 1 : 0.2,
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

  // Focus and center canvas on a target node (called from detail panel)
  const handleSelectNode = useCallback(
    (nodeId) => {
      setSelectedNodeId(nodeId);
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode && targetNode.position) {
        setCenter(targetNode.position.x + 145, targetNode.position.y + 65, {
          duration: 500,
          zoom: Math.max(zoomLevel, 0.9),
        });
      }
    },
    [nodes, setCenter, zoomLevel]
  );

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
    const bbox = reactFlowWrapper.current.getBoundingClientRect();
    const serializer = new XMLSerializer();
    const content = serializer.serializeToString(svgEl);
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}"><rect width="100%" height="100%" fill="#131418"/>${content}</svg>`;
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
      <div className="flex flex-col items-center justify-center p-20 space-y-5 min-h-[520px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-amber-400" />
          </div>
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center max-w-sm space-y-1.5">
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            Synthesizing Architecture Overview
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dionysus AI is inspecting modules, endpoints, dependencies, and external boundaries to construct an interactive GitDiagram overview.
          </p>
        </div>
      </div>
    );
  }

  if (error && (!architectureData || !architectureData.nodes)) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[460px]">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center max-w-md space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Architecture Generation Failed</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onRefresh(true)} className="text-xs shadow-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!architectureData || !architectureData.nodes || architectureData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[460px]">
        <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center">
          <Boxes className="h-6 w-6 text-muted-foreground opacity-70" />
        </div>
        <div className="text-center max-w-sm space-y-1">
          <h4 className="text-sm font-semibold text-foreground">No Architecture Model Available</h4>
          <p className="text-xs text-muted-foreground">
            Generate an AI-powered high-level GitDiagram architecture overview of this codebase.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => onRefresh(true)} className="text-xs shadow-xs">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Generate Architecture
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col w-full overflow-hidden"
      style={{ height: isFullscreen ? "calc(100vh - 120px)" : "690px" }}
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

      {/* Stats & Group Selector Bar */}
      <GraphStats
        mode="architecture"
        stats={{
          nodeCount: architectureData.nodes?.length || 0,
          edgeCount: architectureData.edges?.length || 0,
          groupCount: architectureData.groups?.length || 0,
        }}
        metadata={architectureData.metadata || {}}
        groups={architectureData.groups || []}
        activeGroup={activeGroup}
        onGroupSelect={setActiveGroup}
      />

      {/* React Flow Canvas */}
      <div className="relative flex-1 w-full h-full bg-background/40">
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
          {/* Subtle grid background */}
          <Background color="var(--border)" gap={24} size={1} />
          <Controls
            showInteractive={false}
            className="!border-border/60 !bg-card/90 !backdrop-blur-md !shadow-lg !rounded-lg"
          />
          {showMinimap && (
            <MiniMap
              nodeStrokeColor="#71717a"
              nodeColor="#27272a"
              nodeBorderRadius={6}
              className="!border-border/60 !bg-card/90 !backdrop-blur-md !rounded-xl !shadow-2xl"
            />
          )}
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            allNodes={nodes}
            allEdges={edges}
            _mode="architecture"
            githubUrl={githubUrl}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={handleSelectNode}
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

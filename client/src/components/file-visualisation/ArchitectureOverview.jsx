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
import GroupNode from "./nodes/GroupNode";
import GraphControls from "./panels/GraphControls";
import GraphStats from "./panels/GraphStats";
import NodeDetailPanel from "./panels/NodeDetailPanel";
import { layoutArchitectureDiagram, exportGraphAsJSON } from "@/lib/graphUtils";
import { getEdgeStyle } from "@/lib/graphStyles";
import { toast } from "sonner";
import { RefreshCw, Boxes, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  architectureNode: ArchitectureNode,
  groupNode: GroupNode,
};

function ArchitectureOverviewFlow({
  architectureData,
  githubUrl,
  isLoading,
  error,
  onRefresh,
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

  // Transform raw architecture data using GitDiagram-style group layout
  const layoutResult = useMemo(() => {
    if (!architectureData || !architectureData.nodes || architectureData.nodes.length === 0) {
      return { initialNodes: [], initialEdges: [], nodes: [], edges: [] };
    }

    try {
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
            strokeWidth: 2,
            strokeDasharray: edgeStyle.strokeDasharray,
          },
          labelStyle: {
            fill: "var(--foreground)",
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: "var(--card)",
            fillOpacity: 1,
            stroke: "var(--border)",
            strokeWidth: 1.5,
            rx: 4,
            ry: 4,
          },
          data: edge,
        };
      });

      return layoutArchitectureDiagram(flowNodes, flowEdges, direction);
    } catch (err) {
      console.error("Architecture layout error:", err);
      return { initialNodes: [], initialEdges: [], nodes: [], edges: [] };
    }
  }, [architectureData, direction]);

  // Set nodes and edges with fitView that respects readability
  useEffect(() => {
    const rawN = layoutResult?.initialNodes || layoutResult?.nodes;
    const rawE = layoutResult?.initialEdges || layoutResult?.edges;
    if (!rawN || rawN.length === 0) return;

    setNodes(rawN);
    setEdges(rawE || []);

    setTimeout(() => {
      fitView({
        padding: 0.12,
        minZoom: 0.55,
        maxZoom: 1.1,
        duration: 400,
      });
    }, 60);
  }, [layoutResult, setNodes, setEdges, fitView]);

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
      if (node.type === "groupNode") {
        const isGroupMatched = activeGroup === "all" || node.data?.id === activeGroup;
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isGroupMatched ? 1 : 0.15,
            transition: "opacity 0.25s ease",
          },
        };
      }

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
          opacity: isVisible ? 1 : 0.08,
          transition: "opacity 0.25s ease, filter 0.25s ease",
          filter: isVisible ? "none" : "grayscale(90%)",
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
          strokeWidth: isConnected ? 3 : 1.5,
          opacity: isConnected ? 1 : 0.12,
        },
      };
    });
  }, [edges, selectedNodeId]);

  const onNodeClick = useCallback((event, node) => {
    if (node.type === "groupNode") return;
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Focus and center canvas on a target node
  const handleSelectNode = useCallback(
    (nodeId) => {
      setSelectedNodeId(nodeId);
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode && targetNode.position) {
        setCenter(targetNode.position.x + 135, targetNode.position.y + 55, {
          duration: 500,
          zoom: 0.95,
        });
      }
    },
    [nodes, setCenter]
  );

  const handleResetView = () => {
    fitView({ padding: 0.12, minZoom: 0.55, maxZoom: 1.1, duration: 300 });
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
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}"><rect width="100%" height="100%" fill="#ffffff"/>${content}</svg>`;
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
    return nodes.find((n) => n.id === selectedNodeId && n.type !== "groupNode") || null;
  }, [nodes, selectedNodeId]);

  if (isLoading && (!architectureData || !architectureData.nodes)) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-5">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 flex items-center justify-center animate-pulse">
            <Sparkles className="h-7 w-7 text-amber-500" />
          </div>
          <RefreshCw className="h-4 w-4 animate-spin text-amber-500 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center max-w-xs space-y-1">
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            Generating Architecture
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Analyzing modules, services, and databases into visual tiers...
          </p>
        </div>
      </div>
    );
  }

  if (error && (!architectureData || !architectureData.nodes)) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="h-11 w-11 rounded-xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="text-center max-w-sm space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Architecture Generation Failed</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onRefresh(true)} className="text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!architectureData || !architectureData.nodes || architectureData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="h-11 w-11 rounded-xl bg-muted/40 border-2 border-border flex items-center justify-center">
          <Boxes className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center max-w-xs space-y-1">
          <h4 className="text-sm font-semibold text-foreground">No Architecture Model</h4>
          <p className="text-xs text-muted-foreground">
            Generate an AI-powered architecture overview of this codebase.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => onRefresh(true)} className="text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Generate Architecture
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      ref={reactFlowWrapper}
    >
      {/* Controls Bar */}
      <GraphControls
        zoom={zoomLevel}
        onZoomIn={() => zoomIn({ duration: 200 })}
        onZoomOut={() => zoomOut({ duration: 200 })}
        onFitView={handleResetView}
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

      {/* React Flow Canvas — fills all remaining space */}
      <div className="relative flex-1 w-full min-h-0 bg-slate-50/40 dark:bg-background/30">
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
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={28} size={1} />
          <Controls
            showInteractive={false}
            className="!border !border-border/60 !bg-card/90 !backdrop-blur-sm !shadow-lg !rounded-lg"
          />
          {showMinimap && (
            <MiniMap
              nodeStrokeColor="#64748b"
              nodeColor={(node) => (node.type === "groupNode" ? "#e2e8f0" : "#94a3b8")}
              nodeBorderRadius={4}
              className="!border !border-border/60 !bg-card/90 !backdrop-blur-sm !rounded-xl !shadow-xl"
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

class VisualizationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Architecture visualizer error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="h-11 w-11 rounded-xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-center max-w-md space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Diagram Render Error</h4>
            <p className="text-xs text-muted-foreground">{this.state.error?.message || "Could not render graph."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ArchitectureOverview(props) {
  return (
    <VisualizationErrorBoundary>
      <ReactFlowProvider>
        <ArchitectureOverviewFlow {...props} />
      </ReactFlowProvider>
    </VisualizationErrorBoundary>
  );
}

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

import DependencyNode from "./nodes/DependencyNode";
import GraphControls from "./panels/GraphControls";
import GraphStats from "./panels/GraphStats";
import NodeDetailPanel from "./panels/NodeDetailPanel";
import { layoutDependencyGraph, exportGraphAsJSON } from "@/lib/graphUtils";
import { getEdgeStyle } from "@/lib/graphStyles";
import { toast } from "sonner";
import { RefreshCw, GitBranch, AlertCircle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  dependencyNode: DependencyNode,
};

function DependencyGraphFlow({
  dependencyData,
  githubUrl,
  isLoading,
  error,
  onRefresh,
  isFullscreen,
}) {
  const reactFlowWrapper = useRef(null);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const [direction, setDirection] = useState("LR");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedExt, setSelectedExt] = useState("all");
  const [showCircularOnly, setShowCircularOnly] = useState(false);
  const [hideIsolated, setHideIsolated] = useState(true); // Default hide isolated files to make diagram much cleaner!
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Extract raw nodes and edges from dependencyData
  const rawNodes = useMemo(() => dependencyData?.nodes || [], [dependencyData]);
  const rawEdges = useMemo(() => dependencyData?.edges || [], [dependencyData]);
  const filters = useMemo(() => dependencyData?.filters || { directories: [], extensions: [] }, [dependencyData]);
  const statistics = useMemo(() => dependencyData?.statistics || {}, [dependencyData]);

  // Build React Flow nodes and edges with intelligent filtering
  const layoutResult = useMemo(() => {
    if (rawNodes.length === 0) {
      return { initialNodes: [], initialEdges: [], nodes: [], edges: [] };
    }

    try {
      // Filter nodes
      const filteredRawNodes = rawNodes.filter((node) => {
        if (selectedFolder !== "all" && node.directory !== selectedFolder) {
          return false;
        }
        if (selectedExt !== "all" && node.extension !== selectedExt) {
          return false;
        }
        if (showCircularOnly && !node.isCircular) {
          return false;
        }
        if (hideIsolated && node.incomingCount === 0 && node.outgoingCount === 0) {
          return false;
        }
        return true;
      });

      const activeNodeIds = new Set(filteredRawNodes.map((n) => n.id));

      const flowNodes = filteredRawNodes.map((node) => ({
        id: node.id,
        type: "dependencyNode",
        data: {
          ...node,
        },
        position: { x: 0, y: 0 },
      }));

      // Filter edges to only those connecting active nodes
      const flowEdges = rawEdges
        .filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))
        .map((edge) => {
          const edgeStyle = getEdgeStyle(edge.type, false, edge.isCircular);
          return {
            id: edge.id || `e_${edge.source}_${edge.target}`,
            source: edge.source,
            target: edge.target,
            type: "smoothstep",
            label: edge.symbols && edge.symbols.length > 0 && edge.symbols[0] !== "*side-effect*"
              ? edge.symbols.slice(0, 2).join(", ")
              : "",
            animated: edgeStyle.animated,
            style: {
              stroke: edgeStyle.stroke,
              strokeWidth: 2,
              strokeDasharray: edgeStyle.strokeDasharray,
            },
            labelStyle: {
              fill: "var(--foreground)",
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: "var(--card)",
              fillOpacity: 1,
              stroke: "var(--border)",
              strokeWidth: 1.5,
              rx: 3,
              ry: 3,
            },
            data: edge,
          };
        });

      return layoutDependencyGraph(flowNodes, flowEdges, direction);
    } catch (err) {
      console.error("Dependency layout error:", err);
      return { initialNodes: [], initialEdges: [], nodes: [], edges: [] };
    }
  }, [rawNodes, rawEdges, selectedFolder, selectedExt, showCircularOnly, hideIsolated, direction]);

  // Apply layout with sensible zoom limit
  useEffect(() => {
    const rawN = layoutResult?.initialNodes || layoutResult?.nodes;
    const rawE = layoutResult?.initialEdges || layoutResult?.edges;

    if (!rawN || rawN.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setNodes(rawN);
    setEdges(rawE || []);

    setTimeout(() => {
      fitView({
        padding: 0.15,
        minZoom: 0.65, // Never shrink to illegible 15%!
        maxZoom: 1.1,
        duration: 400,
      });
    }, 60);
  }, [layoutResult, setNodes, setEdges, fitView]);

  const onMoveEnd = useCallback((event, viewport) => {
    if (viewport && typeof viewport.zoom === "number") {
      setZoomLevel(viewport.zoom);
    }
  }, []);

  // Search filter
  const filteredNodes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return nodes;

    return nodes.map((node) => {
      const match =
        node.data.label?.toLowerCase().includes(q) ||
        node.data.path?.toLowerCase().includes(q) ||
        node.data.directory?.toLowerCase().includes(q);

      return {
        ...node,
        style: {
          ...node.style,
          opacity: match ? 1 : 0.12,
          transition: "opacity 0.25s ease, filter 0.25s ease",
          filter: match ? "none" : "grayscale(90%)",
        },
      };
    });
  }, [nodes, searchTerm]);

  // Highlight incoming (emerald) and outgoing (blue) dependencies on selection
  const styledEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    return edges.map((edge) => {
      const isOutgoing = edge.source === selectedNodeId;
      const isIncoming = edge.target === selectedNodeId;
      const isConnected = isOutgoing || isIncoming;

      let strokeColor = "#64748b";
      if (isOutgoing) strokeColor = "#3b82f6"; // blue outgoing
      if (isIncoming) strokeColor = "#10b981"; // emerald incoming

      return {
        ...edge,
        animated: isConnected,
        style: {
          ...edge.style,
          stroke: isConnected ? strokeColor : "#cbd5e1 dark:#3f3f46",
          strokeWidth: isConnected ? 3 : 1.2,
          opacity: isConnected ? 1 : 0.15,
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

  const handleSelectNode = useCallback(
    (nodeId) => {
      setSelectedNodeId(nodeId);
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode && targetNode.position) {
        setCenter(targetNode.position.x + 130, targetNode.position.y + 42, {
          duration: 500,
          zoom: 0.95,
        });
      }
    },
    [nodes, setCenter]
  );

  const handleResetView = () => {
    fitView({ padding: 0.15, minZoom: 0.65, maxZoom: 1.1, duration: 300 });
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
    a.download = "dependency-graph.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Dependency graph exported as SVG!");
  };

  const handleExportJSON = () => {
    exportGraphAsJSON(dependencyData, "dependency-graph.json");
    toast.success("Dependency graph exported as JSON!");
  };

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  if (isLoading && rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-5 min-h-[550px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center animate-pulse">
            <Cpu className="h-8 w-8 text-cyan-500" />
          </div>
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-500 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center max-w-sm space-y-1.5">
          <h4 className="text-sm font-bold text-foreground tracking-tight">
            Mapping Code Dependencies
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Parsing ES imports, exports, CommonJS require statements, and discovering cross-file references...
          </p>
        </div>
      </div>
    );
  }

  if (error && rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[480px]">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center max-w-md space-y-1">
          <h4 className="text-sm font-bold text-foreground">Dependency Mapping Failed</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onRefresh(true)} className="text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Mapping
        </Button>
      </div>
    );
  }

  if (rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[480px]">
        <div className="h-12 w-12 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center">
          <GitBranch className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center max-w-sm space-y-1">
          <h4 className="text-sm font-bold text-foreground">No Dependency Graph Generated</h4>
          <p className="text-xs text-muted-foreground">
            Perform static source-code analysis to discover actual module dependencies.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => onRefresh(true)} className="text-xs font-semibold">
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          Analyze Code Dependencies
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col w-full overflow-hidden"
      style={{ height: isFullscreen ? "calc(100vh - 120px)" : "740px" }}
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
        placeholder="Filter by file or symbol..."
      />

      {/* Stats and Filter Bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-1.5 text-xs">
        <GraphStats
          mode="dependency"
          stats={statistics}
          folders={filters.directories || []}
          selectedFolder={selectedFolder}
          onFolderChange={setSelectedFolder}
          extensions={filters.extensions || []}
          selectedExt={selectedExt}
          onExtChange={setSelectedExt}
          showCircularOnly={showCircularOnly}
          onToggleCircularOnly={() => setShowCircularOnly(!showCircularOnly)}
        />

        {/* Clean View Toggle: Hide / Show Isolated Files */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border/40 flex-shrink-0">
          <button
            onClick={() => setHideIsolated(!hideIsolated)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              hideIsolated
                ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle isolated files with zero connections"
          >
            {hideIsolated ? "Filtered: Connected Only" : "Showing All (Incl. Isolated)"}
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="relative flex-1 w-full h-full bg-slate-50/60 dark:bg-background/40">
        <ReactFlow
          nodes={filteredNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onMoveEnd={onMoveEnd}
          minZoom={0.2}
          maxZoom={2.0}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={24} size={1.2} />
          <Controls
            showInteractive={false}
            className="!border-2 !border-border !bg-card !shadow-md !rounded-lg"
          />
          {showMinimap && (
            <MiniMap
              nodeStrokeColor="#64748b"
              nodeColor="#94a3b8"
              nodeBorderRadius={4}
              className="!border-2 !border-border !bg-card !rounded-xl !shadow-xl"
            />
          )}
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            allNodes={nodes}
            allEdges={edges}
            _mode="dependency"
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
    console.error("Dependency visualizer error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[480px]">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center max-w-md space-y-1">
            <h4 className="text-sm font-bold text-foreground">Dependency Diagram Render Error</h4>
            <p className="text-xs text-muted-foreground">{this.state.error?.message || "Could not render dependency graph."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reload Diagram
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DependencyGraph(props) {
  return (
    <VisualizationErrorBoundary>
      <ReactFlowProvider>
        <DependencyGraphFlow {...props} />
      </ReactFlowProvider>
    </VisualizationErrorBoundary>
  );
}

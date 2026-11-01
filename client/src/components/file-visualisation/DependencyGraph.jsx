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
import { getLayoutedElements, exportGraphAsJSON } from "@/lib/graphUtils";
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
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.8);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Extract raw nodes and edges from dependencyData
  const rawNodes = useMemo(() => dependencyData?.nodes || [], [dependencyData]);
  const rawEdges = useMemo(() => dependencyData?.edges || [], [dependencyData]);
  const filters = useMemo(() => dependencyData?.filters || { directories: [], extensions: [] }, [dependencyData]);
  const statistics = useMemo(() => dependencyData?.statistics || {}, [dependencyData]);

  // Build React Flow nodes and edges with filtering
  const { initialNodes, initialEdges } = useMemo(() => {
    if (rawNodes.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

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
      return true;
    });

    const activeNodeIds = new Set(filteredRawNodes.map((n) => n.id));

    const flowNodes = filteredRawNodes.map((node) => ({
      id: node.id,
      type: "dependencyNode",
      data: {
        ...node,
        targetPosition: direction === "LR" ? "left" : "top",
        sourcePosition: direction === "LR" ? "right" : "bottom",
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
            strokeWidth: edgeStyle.strokeWidth,
            strokeDasharray: edgeStyle.strokeDasharray,
          },
          labelStyle: {
            fill: "var(--muted-foreground)",
            fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
          },
          labelBgStyle: {
            fill: "color-mix(in oklch, var(--card) 95%, transparent)",
            fillOpacity: 0.95,
            stroke: "var(--border)",
            strokeWidth: 1,
            rx: 3,
            ry: 3,
          },
          data: edge,
        };
      });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [rawNodes, rawEdges, selectedFolder, selectedExt, showCircularOnly, direction]);

  // Apply Dagre layout
  useEffect(() => {
    if (initialNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      direction,
      { nodeWidth: 270, nodeHeight: 110, nodesep: 40, ranksep: 70 }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    setTimeout(() => {
      fitView({ padding: 0.15, duration: 400 });
    }, 50);
  }, [initialNodes, initialEdges, direction, setNodes, setEdges, fitView]);

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
          opacity: match ? 1 : 0.15,
          transition: "opacity 0.25s ease, filter 0.25s ease",
          filter: match ? "none" : "grayscale(80%)",
        },
      };
    });
  }, [nodes, searchTerm]);

  // Highlight incoming and outgoing dependencies on selection
  const styledEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    return edges.map((edge) => {
      const isOutgoing = edge.source === selectedNodeId;
      const isIncoming = edge.target === selectedNodeId;
      const isConnected = isOutgoing || isIncoming;

      let strokeColor = "#64748b";
      if (isOutgoing) strokeColor = "#38bdf8"; // blue outgoing
      if (isIncoming) strokeColor = "#34d399"; // emerald incoming

      return {
        ...edge,
        animated: isConnected,
        style: {
          ...edge.style,
          stroke: isConnected ? strokeColor : "#3f3f46",
          strokeWidth: isConnected ? 2.5 : 1,
          opacity: isConnected ? 1 : 0.18,
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
        setCenter(targetNode.position.x + 135, targetNode.position.y + 55, {
          duration: 500,
          zoom: Math.max(zoomLevel, 0.9),
        });
      }
    },
    [nodes, setCenter, zoomLevel]
  );

  const handleResetView = () => {
    fitView({ padding: 0.15, duration: 300 });
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
      <div className="flex flex-col items-center justify-center p-20 space-y-5 min-h-[520px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center animate-pulse">
            <Cpu className="h-8 w-8 text-cyan-400" />
          </div>
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-400 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center max-w-sm space-y-1.5">
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            Mapping Code Dependencies
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Parsing ES imports, exports, CommonJS require calls, and resolving cross-file module paths...
          </p>
        </div>
      </div>
    );
  }

  if (error && rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[460px]">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center max-w-md space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Dependency Mapping Failed</h4>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onRefresh(true)} className="text-xs shadow-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Mapping
        </Button>
      </div>
    );
  }

  if (rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 min-h-[460px]">
        <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center">
          <GitBranch className="h-6 w-6 text-muted-foreground opacity-70" />
        </div>
        <div className="text-center max-w-sm space-y-1">
          <h4 className="text-sm font-semibold text-foreground">No Dependency Graph Generated</h4>
          <p className="text-xs text-muted-foreground">
            Perform static source-code analysis to uncover actual module dependency relationships.
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => onRefresh(true)} className="text-xs shadow-xs">
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          Analyze Code Dependencies
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
        onFitView={() => fitView({ padding: 0.15, duration: 300 })}
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
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
        >
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

export default function DependencyGraph(props) {
  return (
    <ReactFlowProvider>
      <DependencyGraphFlow {...props} />
    </ReactFlowProvider>
  );
}

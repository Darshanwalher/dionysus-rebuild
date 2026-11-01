import React from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  FileJson,
  RefreshCw,
  Search,
  ArrowDownUp,
  ArrowLeftRight,
  Map,
  X,
} from "lucide-react";

export default function GraphControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  direction = "TB",
  onToggleDirection,
  searchTerm = "",
  onSearchChange,
  showMinimap,
  onToggleMinimap,
  onExportSVG,
  onExportJSON,
  onRefresh,
  isLoading = false,
  placeholder = "Search nodes...",
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-sm flex-shrink-0 flex-wrap">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Zoom and Fit View Controls */}
      <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-background/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[11px] font-mono px-2 text-muted-foreground min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border/60 mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onFitView}
          title="Fit to Screen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onResetView}
          title="Reset View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Direction Toggle (Vertical / Horizontal) */}
      <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
        <button
          onClick={() => onToggleDirection("TB")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            direction === "TB"
              ? "bg-muted text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Vertical Hierarchy (Top-to-Bottom)"
        >
          <ArrowDownUp className="h-3 w-3" />
          Vertical
        </button>
        <button
          onClick={() => onToggleDirection("LR")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            direction === "LR"
              ? "bg-muted text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Horizontal Flow (Left-to-Right)"
        >
          <ArrowLeftRight className="h-3 w-3" />
          Horizontal
        </button>
      </div>

      {/* Minimap toggle */}
      <Button
        variant="outline"
        size="sm"
        className={`h-7 px-2.5 text-xs border-border/60 ${
          showMinimap ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={onToggleMinimap}
        title="Toggle Minimap"
      >
        <Map className="h-3.5 w-3.5 mr-1" />
        Minimap
      </Button>

      {/* Refresh / Regenerate */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs border-border/60 text-muted-foreground hover:text-foreground"
        onClick={onRefresh}
        disabled={isLoading}
        title="Regenerate visualization"
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button>

      {/* Export Options */}
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground"
          onClick={onExportSVG}
          title="Export as SVG image"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export SVG
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground"
          onClick={onExportJSON}
          title="Export graph data as JSON"
        >
          <FileJson className="h-3.5 w-3.5 mr-1.5" />
          JSON
        </Button>
      </div>
    </div>
  );
}


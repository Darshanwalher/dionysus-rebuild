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
  placeholder = "Search components or files...",
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-md flex-shrink-0 flex-wrap justify-between">
      {/* Search Input with Clear Button */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground/70" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-1.5 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/60 focus:border-ring rounded-lg transition-all text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        {searchTerm ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="absolute right-2.5 top-2 text-[9px] font-mono text-muted-foreground/50 border border-border/40 rounded px-1 select-none pointer-events-none">
            /
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Zoom & Fit View Group */}
        <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-background/50 shadow-xs">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>

          <span className="text-[11px] font-mono px-2 text-muted-foreground min-w-[42px] text-center select-none">
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

          <div className="w-px h-3.5 bg-border/60 mx-0.5" />

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
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Orientation Toggle (TB vs LR) */}
        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50 shadow-xs">
          <button
            onClick={() => onToggleDirection("TB")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              direction === "TB"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vertical Layout (Top-to-Bottom)"
          >
            <ArrowDownUp className="h-3 w-3" />
            Vertical
          </button>
          <button
            onClick={() => onToggleDirection("LR")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              direction === "LR"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Horizontal Layout (Left-to-Right)"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Horizontal
          </button>
        </div>

        {/* Minimap toggle */}
        <Button
          variant="outline"
          size="sm"
          className={`h-7 px-2.5 text-xs border-border/60 transition-all ${
            showMinimap
              ? "bg-muted text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onToggleMinimap}
          title="Toggle Canvas Minimap"
        >
          <Map className="h-3.5 w-3.5 mr-1" />
          Minimap
        </Button>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs border-border/60 text-muted-foreground hover:text-foreground transition-all"
          onClick={onRefresh}
          disabled={isLoading}
          title="Regenerate visualization analysis"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          Refresh
        </Button>

        {/* Export Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground"
            onClick={onExportSVG}
            title="Export Vector SVG"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground"
            onClick={onExportJSON}
            title="Export Graph Data JSON"
          >
            <FileJson className="h-3.5 w-3.5 mr-1.5" />
            JSON
          </Button>
        </div>
      </div>
    </div>
  );
}

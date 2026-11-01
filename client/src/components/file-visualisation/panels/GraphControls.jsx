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
  placeholder = "Search...",
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/40 bg-card/50 backdrop-blur-md flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px] max-w-xs">
        <Search className="h-3 w-3 absolute left-2.5 top-[7px] text-muted-foreground/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-7 py-1 text-[11px] bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border/40 focus:border-ring/60 rounded-md transition-all text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {searchTerm ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-[6px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <span className="absolute right-2 top-[6px] text-[8px] font-mono text-muted-foreground/40 border border-border/30 rounded px-0.5 select-none pointer-events-none">
            /
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border/40 mx-0.5 flex-shrink-0" />

      {/* Zoom Group */}
      <div className="flex items-center border border-border/40 rounded-md p-px bg-background/40">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="text-[10px] font-mono px-1.5 text-muted-foreground min-w-[34px] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="h-3 w-3" />
        </Button>
        <div className="w-px h-3 bg-border/40" />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={onFitView} title="Fit">
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={onResetView} title="Reset">
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Direction Toggle */}
      <div className="flex items-center p-px rounded-md border border-border/40 bg-background/40">
        <button
          onClick={() => onToggleDirection("TB")}
          className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
            direction === "TB"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Vertical"
        >
          <ArrowDownUp className="h-2.5 w-2.5" />
          <span className="hidden xl:inline">Vertical</span>
        </button>
        <button
          onClick={() => onToggleDirection("LR")}
          className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
            direction === "LR"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Horizontal"
        >
          <ArrowLeftRight className="h-2.5 w-2.5" />
          <span className="hidden xl:inline">Horizontal</span>
        </button>
      </div>

      {/* Minimap */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 text-[10px] transition-all ${
          showMinimap
            ? "bg-muted text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={onToggleMinimap}
        title="Minimap"
      >
        <Map className="h-3 w-3 mr-1" />
        <span className="hidden lg:inline">Minimap</span>
      </Button>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={onRefresh}
        disabled={isLoading}
        title="Refresh"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
        <span className="hidden lg:inline">Refresh</span>
      </Button>

      <div className="h-4 w-px bg-border/40 mx-0.5 flex-shrink-0" />

      {/* Export */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={onExportSVG}
          title="Export SVG"
        >
          <Download className="h-3 w-3 mr-1" />
          SVG
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={onExportJSON}
          title="Export JSON"
        >
          <FileJson className="h-3 w-3 mr-1" />
          JSON
        </Button>
      </div>
    </div>
  );
}

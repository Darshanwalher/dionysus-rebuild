import React from "react";
import {
  Layers,
  AlertTriangle,
  Radio,
  FileCode,
  Sparkles,
} from "lucide-react";

export default function GraphStats({
  mode = "architecture", // 'architecture' | 'dependency'
  stats = {},
  metadata = {},
  selectedFolder = "all",
  folders = [],
  onFolderChange,
  selectedExt = "all",
  extensions = [],
  onExtChange,
  showCircularOnly = false,
  onToggleCircularOnly,
}) {
  if (mode === "architecture") {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold text-foreground">
            {metadata.architecturalStyle || "Full-Stack System"}
          </span>
        </div>

        <div className="h-3 w-px bg-border/60 mx-1" />

        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <span>
            <strong className="text-foreground">{stats.nodeCount || 0}</strong> components
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{stats.groupCount || 0}</strong> groups
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{stats.edgeCount || 0}</strong> connections
          </span>
        </div>

        {metadata.summary && (
          <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-md hidden lg:inline-block">
            {metadata.summary}
          </span>
        )}
      </div>
    );
  }

  // Dependency mode
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs overflow-x-auto flex-wrap">
      {/* Metrics */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileCode className="h-3.5 w-3.5 text-foreground" />
          <strong className="text-foreground">{stats.totalFiles || 0}</strong> files
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          <strong className="text-foreground">{stats.totalDependencies || 0}</strong> dependencies
        </span>
        <span>·</span>
        <span className="flex items-center gap-1 text-red-400 font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          {stats.circularDependencies || 0} circular
        </span>
        <span>·</span>
        <span className="flex items-center gap-1 text-zinc-400">
          <Radio className="h-3.5 w-3.5" />
          {stats.isolatedFiles || 0} isolated
        </span>
      </div>

      <div className="h-3 w-px bg-border/60 mx-1 hidden sm:block" />

      {/* Directory Filter */}
      {folders && folders.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-mono text-[10px] uppercase">Folder:</span>
          <select
            value={selectedFolder}
            onChange={(e) => onFolderChange(e.target.value)}
            className="bg-card border border-border/60 rounded px-2 py-0.5 text-xs font-mono text-foreground focus:outline-none"
          >
            <option value="all">All Directories</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Extension Filter */}
      {extensions && extensions.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-mono text-[10px] uppercase">Ext:</span>
          <select
            value={selectedExt}
            onChange={(e) => onExtChange(e.target.value)}
            className="bg-card border border-border/60 rounded px-2 py-0.5 text-xs font-mono text-foreground focus:outline-none"
          >
            <option value="all">All Extensions</option>
            {extensions.map((ext) => (
              <option key={ext} value={ext}>
                {ext}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Circular dependency toggle */}
      {stats.circularDependencies > 0 && (
        <button
          onClick={onToggleCircularOnly}
          className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
            showCircularOnly
              ? "bg-red-500/20 text-red-400 border-red-500/50"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{showCircularOnly ? "Showing Cycles" : "Filter Cycles"}</span>
        </button>
      )}
    </div>
  );
}

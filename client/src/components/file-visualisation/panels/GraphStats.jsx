import React from "react";
import {
  Layers,
  AlertTriangle,
  Radio,
  FileCode,
  Sparkles,
  Boxes,
  Network,
  Filter,
} from "lucide-react";

export default function GraphStats({
  mode = "architecture", // 'architecture' | 'dependency'
  stats = {},
  metadata = {},
  groups = [],
  activeGroup = "all",
  onGroupSelect,
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
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs overflow-x-auto select-none">
        {/* Architectural Style Pill */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground flex-shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold text-foreground tracking-tight">
            {metadata.architecturalStyle || "Full-Stack Architecture"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-border/60 mx-1 flex-shrink-0" />

        {/* Core Metrics */}
        <div className="flex items-center gap-2.5 text-muted-foreground font-mono text-[11px] flex-shrink-0">
          <span className="flex items-center gap-1">
            <Boxes className="h-3 w-3 text-sky-400" />
            <strong className="text-foreground">{stats.nodeCount || 0}</strong> components
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-400" />
            <strong className="text-foreground">{stats.groupCount || 0}</strong> groups
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Network className="h-3 w-3 text-emerald-400" />
            <strong className="text-foreground">{stats.edgeCount || 0}</strong> connections
          </span>
        </div>

        {/* Group Filter Chips */}
        {groups && groups.length > 0 && (
          <>
            <div className="h-3.5 w-px bg-border/60 mx-1 flex-shrink-0 hidden md:block" />
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                onClick={() => onGroupSelect && onGroupSelect("all")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex-shrink-0 ${
                  activeGroup === "all"
                    ? "bg-muted text-foreground font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Groups
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onGroupSelect && onGroupSelect(g.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex-shrink-0 ${
                    activeGroup === g.id
                      ? "bg-muted text-foreground font-semibold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.label || g.name || g.id}
                </button>
              ))}
            </div>
          </>
        )}

        {metadata.summary && (
          <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-sm hidden xl:inline-block opacity-80" title={metadata.summary}>
            {metadata.summary}
          </span>
        )}
      </div>
    );
  }

  // Dependency mode
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs overflow-x-auto flex-wrap select-none">
      {/* Metrics */}
      <div className="flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1">
          <FileCode className="h-3.5 w-3.5 text-foreground" />
          <strong className="text-foreground">{stats.totalFiles || 0}</strong> files
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-sky-400" />
          <strong className="text-foreground">{stats.totalDependencies || 0}</strong> dependencies
        </span>
        <span>·</span>
        <span className="flex items-center gap-1 text-rose-400 font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          {stats.circularDependencies || 0} circular
        </span>
        <span>·</span>
        <span className="flex items-center gap-1 text-zinc-400">
          <Radio className="h-3.5 w-3.5" />
          {stats.isolatedFiles || 0} isolated
        </span>
      </div>

      <div className="h-3.5 w-px bg-border/60 mx-1 hidden sm:block flex-shrink-0" />

      {/* Directory Filter */}
      {folders && folders.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
          <Filter className="h-3 w-3 text-muted-foreground opacity-70" />
          <select
            value={selectedFolder}
            onChange={(e) => onFolderChange(e.target.value)}
            className="bg-card border border-border/60 hover:border-border rounded-md px-2 py-0.5 text-xs font-mono text-foreground focus:outline-none transition-colors"
          >
            <option value="all">All Folders</option>
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
        <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
          <select
            value={selectedExt}
            onChange={(e) => onExtChange(e.target.value)}
            className="bg-card border border-border/60 hover:border-border rounded-md px-2 py-0.5 text-xs font-mono text-foreground focus:outline-none transition-colors"
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
          className={`ml-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border transition-all ${
            showCircularOnly
              ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-xs"
              : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <AlertTriangle className="h-3 w-3 text-rose-400" />
          <span>{showCircularOnly ? "Showing Cycles Only" : "Filter Cycles"}</span>
        </button>
      )}
    </div>
  );
}

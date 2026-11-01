import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileJson,
  FileCode,
  FileText,
  Image,
  Settings,
  EyeOff,
  Eye,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import {
  collectIdsToDepth,
  collectMatchingIds,
  countStats,
  filterNoise,
  isNoiseDir,
} from "@/lib/fileTree";

const EXT_ICON = {
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  json: FileJson,
  jsonc: FileJson,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  yml: FileText,
  yaml: FileText,
  svg: Image,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  ico: Image,
  webp: Image,
  env: Settings,
  toml: Settings,
  ini: Settings,
};

function fileIcon(name) {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return EXT_ICON[ext] || File;
}

function highlightName(name, searchTerm) {
  if (!searchTerm) return name;
  const q = searchTerm.toLowerCase();
  const lower = name.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="bg-amber-400/20 text-amber-500 dark:text-amber-300 font-bold rounded-xs px-0.5">
        {name.slice(idx, idx + searchTerm.length)}
      </span>
      {name.slice(idx + searchTerm.length)}
    </>
  );
}

function TreeNode({
  item,
  depth = 0,
  searchTerm,
  expandIds,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  forceVisible = false,
}) {
  const isFolder = item.type === "folder";
  const q = searchTerm.trim().toLowerCase();
  const selfMatch = !q || item.name.toLowerCase().includes(q);

  if (q && !forceVisible && !selfMatch && !expandIds.has(item.id)) return null;

  const isOpen = isFolder && expanded.has(item.id);
  const isSelected = selectedId === item.id;
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : fileIcon(item.name);
  const childCount = item.children?.length || 0;

  return (
    <div className="select-none text-xs">
      <div
        onClick={() => {
          onSelect(item);
          if (isFolder) onToggle(item.id);
        }}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-primary/10 text-primary font-semibold"
            : isFolder
              ? "hover:bg-muted/40 text-foreground font-medium"
              : "hover:bg-muted/20 text-muted-foreground hover:text-foreground"
        }`}
      >
        {isFolder ? (
          <span className="text-muted-foreground/60 w-3.5 flex justify-center">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        <Icon
          className={`h-3.5 w-3.5 flex-shrink-0 ${
            isFolder ? "text-amber-400" : "text-sky-400"
          }`}
        />
        <span className={`truncate ${isFolder ? "text-foreground" : "font-mono text-muted-foreground"}`}>
          {highlightName(item.name, searchTerm)}
        </span>
        {isFolder && (
          <span className="text-[10px] text-muted-foreground/60 ml-auto font-mono">
            {childCount}
          </span>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div className="border-l border-border/30 ml-3.5">
          {item.children.map((child, idx) => (
            <TreeNode
              key={child.path || child.id || idx}
              item={child}
              depth={depth + 1}
              searchTerm={searchTerm}
              expandIds={expandIds}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              forceVisible={forceVisible || selfMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreeExplorer({ fileTree, githubUrl }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideNoise, setHideNoise] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [copiedPath, setCopiedPath] = useState(false);

  const visibleTree = useMemo(
    () => filterNoise(fileTree, hideNoise),
    [fileTree, hideNoise]
  );

  const stats = useMemo(() => countStats(visibleTree), [visibleTree]);
  const { expandIds } = useMemo(
    () => collectMatchingIds(visibleTree, searchTerm),
    [visibleTree, searchTerm]
  );

  useEffect(() => {
    if (!visibleTree) return;
    const defaults = collectIdsToDepth(visibleTree, 1);
    for (const child of visibleTree.children || []) {
      if (child.type === "folder" && isNoiseDir(child.name)) {
        defaults.delete(child.id);
      }
    }
    setExpanded(defaults);
    setSelected(visibleTree);
  }, [visibleTree]);

  useEffect(() => {
    if (!searchTerm.trim() || expandIds.size === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      expandIds.forEach((id) => next.add(id));
      return next;
    });
  }, [searchTerm, expandIds]);

  const toggleNode = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandShallow = () => {
    setExpanded(collectIdsToDepth(visibleTree, 3));
  };

  const collapseAll = () => {
    setExpanded(visibleTree ? new Set([visibleTree.id]) : new Set());
  };

  const copyPath = () => {
    if (!selected?.path && !selected?.name) return;
    navigator.clipboard.writeText(selected.path || selected.name);
    setCopiedPath(true);
    toast.success("Path copied to clipboard");
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const githubLink = useMemo(() => {
    if (!githubUrl || !selected?.path) return null;
    const cleanUrl = githubUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    const mode = selected.type === "folder" ? "tree" : "blob";
    return `${cleanUrl}/${mode}/main/${selected.path}`;
  }, [githubUrl, selected]);

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      {/* ─── Compact Controls Bar ─── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 bg-card/50 backdrop-blur-md flex-shrink-0 flex-wrap justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="h-3 w-3 absolute left-2.5 top-[7px] text-muted-foreground/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter files or folders..."
            className="w-full pl-7 pr-7 py-1 text-[11px] bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border/40 focus:border-ring/60 rounded-md transition-all text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-[6px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={expandShallow}
            title="Expand 3 levels deep"
          >
            <ChevronsUpDown className="h-3 w-3 mr-1" />
            Expand
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={collapseAll}
            title="Collapse all folders"
          >
            <ChevronsDownUp className="h-3 w-3 mr-1" />
            Collapse
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-[10px] transition-all ${
              hideNoise ? "text-muted-foreground" : "bg-muted text-foreground font-semibold"
            }`}
            onClick={() => setHideNoise((v) => !v)}
            title="Toggle vendor/build directories like node_modules"
          >
            {hideNoise ? <EyeOff className="h-3 w-3 mr-1 opacity-70" /> : <Eye className="h-3 w-3 mr-1 text-amber-400" />}
            <span className="hidden sm:inline">{hideNoise ? "Noise Hidden" : "Showing Noise"}</span>
          </Button>

          <div className="h-4 w-px bg-border/40 mx-0.5 flex-shrink-0" />

          <span className="text-[10px] font-mono text-muted-foreground/70 select-none">
            {stats.files} files · {stats.folders} folders
          </span>
        </div>
      </div>

      {/* ─── Selected Node Quick Bar ─── */}
      {selected && (
        <div className="flex items-center justify-between px-3 py-1 border-b border-border/30 bg-muted/15 text-[10px] font-mono flex-shrink-0">
          <div className="flex items-center gap-1.5 truncate max-w-xl">
            <span className="text-muted-foreground/60">Selected:</span>
            <span className="text-foreground font-semibold truncate" title={selected.path || selected.name}>
              {selected.path || selected.name}
            </span>
            <button
              onClick={copyPath}
              className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
              title="Copy path"
            >
              {copiedPath ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[9px] uppercase px-1 py-0">
              {selected.type}
              {selected.type === "folder" ? ` · ${selected.children?.length || 0} items` : ""}
            </Badge>

            {githubLink && (
              <a
                href={githubLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[10px] transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ─── Tree Container (Fills rest of height) ─── */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto p-3 font-mono">
        {visibleTree ? (
          <TreeNode
            item={visibleTree}
            depth={0}
            searchTerm={searchTerm}
            expandIds={expandIds}
            expanded={expanded}
            onToggle={toggleNode}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No file structure parsed for this repository.
          </div>
        )}
      </div>
    </div>
  );
}

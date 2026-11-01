import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getComponentMeta } from "@/lib/graphStyles";
import {
  X,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Radio,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function NodeDetailPanel({
  node,
  allEdges = [],
  allNodes = [],
  _mode = "architecture",
  githubUrl,
  onClose,
  onSelectNode,
}) {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedImport, setCopiedImport] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'connections'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const data = node.data || {};
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  const copyPath = () => {
    if (data.path) {
      navigator.clipboard.writeText(data.path);
      setCopiedPath(true);
      toast.success("File path copied to clipboard");
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  // Generate clean import snippet e.g. import Login from "@/pages/Login";
  const generateImportSnippet = () => {
    if (!data.path) return "";
    const cleanPath = data.path.replace(/\\/g, "/");
    const name = data.label ? data.label.replace(/\.[^/.]+$/, "") : "Component";
    return `import ${name} from "./${cleanPath}";`;
  };

  const copyImportSnippet = () => {
    const snippet = generateImportSnippet();
    if (snippet) {
      navigator.clipboard.writeText(snippet);
      setCopiedImport(true);
      toast.success("Import statement copied");
      setTimeout(() => setCopiedImport(false), 2000);
    }
  };

  const incomingEdges = allEdges.filter((e) => e.target === node.id);
  const outgoingEdges = allEdges.filter((e) => e.source === node.id);

  const getNodeInfo = (id) => {
    const found = allNodes.find((n) => n.id === id);
    return {
      label: found?.data?.label || id,
      path: found?.data?.path || "",
      type: found?.data?.type || "component",
    };
  };

  const getGitHubFileLink = (filePath) => {
    if (!githubUrl || !filePath) return null;
    const cleanUrl = githubUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    return `${cleanUrl}/blob/main/${filePath}`;
  };

  const githubLink = getGitHubFileLink(data.path);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-[380px] border-l border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-border/50 bg-muted/15 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-xs flex-shrink-0"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate tracking-tight">
              {data.label}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block truncate">
              {data.groupLabel || data.directory || meta.label}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pt-2 border-b border-border/40 bg-muted/10 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2 transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-amber-400 text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("connections")}
          className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "connections"
              ? "border-amber-400 text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Connections
          <span className="text-[10px] font-mono px-1 rounded bg-muted text-muted-foreground">
            {incomingEdges.length + outgoingEdges.length}
          </span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === "overview" && (
          <>
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] uppercase font-mono ${meta.badge}`}>
                {meta.label}
              </Badge>

              {data.extension && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {data.extension}
                </Badge>
              )}

              {data.isCircular && (
                <Badge variant="destructive" className="text-[10px] font-mono flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Circular Dependency
                </Badge>
              )}

              {data.incomingCount === 0 && data.outgoingCount === 0 && !data.isCircular && (
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
                  <Radio className="h-3 w-3 mr-1" />
                  Isolated File
                </Badge>
              )}
            </div>

            {/* Path Box with Action Buttons */}
            {data.path && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  File Path
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 font-mono text-[11px] text-foreground">
                  <span className="truncate mr-2" title={data.path}>
                    {data.path}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={copyPath}
                      className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                      title="Copy relative path"
                    >
                      {copiedPath ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {githubLink && (
                      <a
                        href={githubLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                        title="Open file in GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Import Snippet */}
            {data.path && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  <span>Import Statement</span>
                  <button
                    onClick={copyImportSnippet}
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    {copiedImport ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedImport ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 font-mono text-[11px] text-foreground/90 overflow-x-auto">
                  <code>{generateImportSnippet()}</code>
                </div>
              </div>
            )}

            {/* Responsibility or Description */}
            {(data.responsibility || data.description) && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Responsibility
                </span>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-muted-foreground leading-relaxed text-xs">
                  {data.responsibility || data.description}
                </div>
              </div>
            )}

            {/* Exported Symbols */}
            {data.exports && data.exports.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Exported Symbols ({data.exports.length})
                </span>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/20 border border-border/40 max-h-36 overflow-y-auto">
                  {data.exports.map((sym, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-muted/70 font-mono text-[10px] text-foreground border border-border/40"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <div className="space-y-4">
            {/* Incoming Connections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                  Incoming Dependencies ({incomingEdges.length})
                </span>
                <span className="text-[9px] text-muted-foreground">Imported By</span>
              </div>

              {incomingEdges.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic p-2 bg-muted/10 rounded border border-border/20">
                  No incoming dependencies.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {incomingEdges.map((edge) => {
                    const info = getNodeInfo(edge.source);
                    return (
                      <div
                        key={edge.id}
                        onClick={() => onSelectNode && onSelectNode(edge.source)}
                        className="group flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/70 cursor-pointer border border-border/40 hover:border-amber-400/40 transition-all shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-amber-400 transition-colors">
                            {info.label}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate opacity-70">
                            {info.path || edge.source}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-card border text-muted-foreground flex-shrink-0">
                          {edge.label || edge.data?.label || edge.data?.type || "connects"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outgoing Connections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-sky-400" />
                  Outgoing Dependencies ({outgoingEdges.length})
                </span>
                <span className="text-[9px] text-muted-foreground">Imports</span>
              </div>

              {outgoingEdges.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic p-2 bg-muted/10 rounded border border-border/20">
                  No outgoing dependencies.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {outgoingEdges.map((edge) => {
                    const info = getNodeInfo(edge.target);
                    return (
                      <div
                        key={edge.id}
                        onClick={() => onSelectNode && onSelectNode(edge.target)}
                        className="group flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/70 cursor-pointer border border-border/40 hover:border-amber-400/40 transition-all shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-amber-400 transition-colors">
                            {info.label}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate opacity-70">
                            {info.path || edge.target}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-card border text-muted-foreground flex-shrink-0">
                          {edge.label || edge.data?.label || edge.data?.type || "imports"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      {githubLink && (
        <div className="p-3 border-t border-border/40 bg-muted/15 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground">GitHub Integration</span>
          <a
            href={githubLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-amber-400 transition-colors"
          >
            <span>Open Source</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

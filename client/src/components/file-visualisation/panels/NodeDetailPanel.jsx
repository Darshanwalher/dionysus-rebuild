import React from "react";
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
  const [copied, setCopied] = React.useState(false);

  if (!node) return null;

  const data = node.data || {};
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  const copyPath = () => {
    if (data.path) {
      navigator.clipboard.writeText(data.path);
      setCopied(true);
      toast.success("File path copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find incoming and outgoing edges for this node
  const incomingEdges = allEdges.filter((e) => e.target === node.id);
  const outgoingEdges = allEdges.filter((e) => e.source === node.id);

  // Helper to get node label by id
  const getNodeLabel = (id) => {
    const found = allNodes.find((n) => n.id === id);
    return found?.data?.label || id;
  };

  const getGitHubFileLink = (filePath) => {
    if (!githubUrl || !filePath) return null;
    const cleanUrl = githubUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    return `${cleanUrl}/blob/main/${filePath}`;
  };

  const githubLink = getGitHubFileLink(data.path);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l border-border/60 bg-card/95 backdrop-blur-md shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border flex-shrink-0"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {data.label}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {data.groupLabel || data.directory || meta.label}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Type & Status Badges */}
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

          {data.incomingCount === 0 && data.outgoingCount === 0 && (
            <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">
              <Radio className="h-3 w-3 mr-1" />
              Isolated File
            </Badge>
          )}
        </div>

        {/* Path block */}
        {data.path && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              File Path
            </span>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 font-mono text-[11px] text-foreground">
              <span className="truncate mr-2" title={data.path}>
                {data.path}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={copyPath}
                  className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                  title="Copy path"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {githubLink && (
                  <a
                    href={githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Responsibility / Description */}
        {(data.responsibility || data.description) && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Responsibility
            </span>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-muted-foreground leading-relaxed">
              {data.responsibility || data.description}
            </div>
          </div>
        )}

        {/* Exported symbols */}
        {data.exports && data.exports.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Exported Symbols ({data.exports.length})
            </span>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 rounded-lg bg-muted/20 border border-border/40">
              {data.exports.map((sym, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground border border-border/40"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Incoming Connections */}
        <div className="space-y-2">
          <span className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            <span>Incoming Dependencies ({incomingEdges.length})</span>
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
          </span>

          {incomingEdges.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No incoming connections.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {incomingEdges.map((edge) => (
                <div
                  key={edge.id}
                  onClick={() => onSelectNode && onSelectNode(edge.source)}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/60 cursor-pointer border border-border/40 transition-colors"
                >
                  <span className="font-mono text-[11px] text-foreground truncate max-w-[180px]">
                    {getNodeLabel(edge.source)}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card border text-muted-foreground">
                    {edge.label || edge.data?.label || edge.data?.type || "connects"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Connections */}
        <div className="space-y-2">
          <span className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            <span>Outgoing Dependencies ({outgoingEdges.length})</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
          </span>

          {outgoingEdges.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No outgoing connections.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {outgoingEdges.map((edge) => (
                <div
                  key={edge.id}
                  onClick={() => onSelectNode && onSelectNode(edge.target)}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/60 cursor-pointer border border-border/40 transition-colors"
                >
                  <span className="font-mono text-[11px] text-foreground truncate max-w-[180px]">
                    {getNodeLabel(edge.target)}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card border text-muted-foreground">
                    {edge.label || edge.data?.label || edge.data?.type || "imports"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

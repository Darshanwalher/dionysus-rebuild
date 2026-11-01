import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import {
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Radio,
} from "lucide-react";

const EXT_COLORS = {
  ".js": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  ".jsx": "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  ".ts": "text-blue-400 border-blue-500/30 bg-blue-500/10",
  ".tsx": "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  ".mjs": "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  ".cjs": "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

function DependencyNode({ data, selected }) {
  const extBadge = EXT_COLORS[data.extension] || "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";
  const isCircular = data.isCircular;
  const isIsolated = data.incomingCount === 0 && data.outgoingCount === 0;

  return (
    <div
      className={`relative w-[260px] rounded-xl border p-3 shadow-md transition-all duration-200 select-none ${
        isCircular
          ? "border-red-500/80 bg-red-950/20 ring-1 ring-red-500/40"
          : selected
            ? "border-amber-400/90 ring-2 ring-amber-400/30 shadow-amber-500/10"
            : "border-border/60 hover:border-border hover:shadow-lg"
      }`}
      style={{
        background: isCircular ? undefined : "var(--card)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-cyan-400 transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground truncate font-mono">
            {data.label}
          </span>
        </div>

        <Badge
          variant="outline"
          className={`text-[9px] font-mono uppercase px-1.5 py-0 border ${extBadge}`}
        >
          {data.extension || "file"}
        </Badge>
      </div>

      {/* Path */}
      <p className="text-[10px] text-muted-foreground font-mono truncate mb-2.5 opacity-80" title={data.path}>
        {data.path}
      </p>

      {/* Status & Stats bar */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
        {/* Incoming / Outgoing pills */}
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-0.5 text-emerald-400 font-mono"
            title={`${data.incomingCount} incoming dependencies (imported by ${data.incomingCount} files)`}
          >
            <ArrowDownLeft className="h-3 w-3" />
            <span>{data.incomingCount}</span>
          </span>

          <span
            className="flex items-center gap-0.5 text-blue-400 font-mono"
            title={`${data.outgoingCount} outgoing dependencies (imports ${data.outgoingCount} files)`}
          >
            <ArrowUpRight className="h-3 w-3" />
            <span>{data.outgoingCount}</span>
          </span>
        </div>

        {/* Circular or Isolated warning */}
        {isCircular && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-red-400 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
            <AlertTriangle className="h-2.5 w-2.5" />
            Circular
          </span>
        )}

        {isIsolated && !isCircular && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20">
            <Radio className="h-2.5 w-2.5" />
            Isolated
          </span>
        )}

        {data.exports && data.exports.length > 0 && !isCircular && !isIsolated && (
          <span className="font-mono text-[9px] text-muted-foreground">
            {data.exports.length} export{data.exports.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-cyan-400 transition-transform hover:scale-125"
      />
    </div>
  );
}

export default memo(DependencyNode);

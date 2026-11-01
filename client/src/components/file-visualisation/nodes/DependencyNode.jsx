import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Radio,
  ArrowRight,
} from "lucide-react";

const EXT_COLORS = {
  ".js": { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", accent: "#fbbf24" },
  ".jsx": { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10", accent: "#22d3ee" },
  ".ts": { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", accent: "#38bdf8" },
  ".tsx": { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10", accent: "#818cf8" },
  ".mjs": { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", accent: "#34d399" },
  ".cjs": { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", accent: "#fb923c" },
};

function DependencyNode({ data, selected }) {
  const extStyle = EXT_COLORS[data.extension] || {
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
    accent: "#a1a1aa",
  };

  const isCircular = data.isCircular;
  const isIsolated = data.incomingCount === 0 && data.outgoingCount === 0;

  return (
    <div
      className={`group relative w-[270px] rounded-xl border transition-all duration-200 select-none ${
        isCircular
          ? "border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/40"
          : selected
            ? "border-amber-400/90 ring-2 ring-amber-400/25 shadow-xl shadow-amber-500/10 scale-[1.02]"
            : "border-border/60 hover:border-border/90 hover:shadow-lg hover:scale-[1.01]"
      }`}
      style={{
        background: isCircular ? undefined : "color-mix(in oklch, var(--card) 92%, transparent)",
        backdropFilter: "blur(16px)",
        boxShadow: selected
          ? "0 0 20px rgba(245, 158, 11, 0.2), 0 8px 24px -4px rgba(0,0,0,0.4)"
          : "0 4px 16px -2px rgba(0,0,0,0.2)",
      }}
    >
      {/* Top ambient highlight line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] rounded-t-xl opacity-60"
        style={{
          background: isCircular
            ? "linear-gradient(90deg, transparent, #f43f5e, transparent)"
            : `linear-gradient(90deg, transparent, ${extStyle.accent}, transparent)`,
        }}
      />

      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/80 transition-all group-hover:!bg-cyan-400 group-hover:scale-125"
      />

      <div className="p-3 space-y-2">
        {/* Header: File Name and Extension Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border"
              style={{
                backgroundColor: extStyle.bg,
                borderColor: extStyle.border,
              }}
            >
              <FileCode className={`h-3.5 w-3.5 ${extStyle.text}`} />
            </div>

            <span className="text-xs font-semibold text-foreground font-mono truncate">
              {data.label}
            </span>
          </div>

          <span
            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${extStyle.text} ${extStyle.border} ${extStyle.bg}`}
          >
            {data.extension || "code"}
          </span>
        </div>

        {/* Path breadcrumb */}
        <p className="text-[10px] text-muted-foreground font-mono truncate opacity-75" title={data.path}>
          {data.path}
        </p>

        {/* Stats footer: Incoming / Outgoing pills & Flags */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-0.5 text-emerald-400 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
              title={`${data.incomingCount} files import this`}
            >
              <ArrowDownLeft className="h-3 w-3" />
              <span>{data.incomingCount}</span>
            </span>

            <span
              className="flex items-center gap-0.5 text-sky-400 font-mono px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20"
              title={`Imports ${data.outgoingCount} files`}
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>{data.outgoingCount}</span>
            </span>
          </div>

          {isCircular ? (
            <span className="flex items-center gap-1 font-mono text-[9px] text-rose-400 font-semibold bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">
              <AlertTriangle className="h-2.5 w-2.5" />
              Cycle
            </span>
          ) : isIsolated ? (
            <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20">
              <Radio className="h-2.5 w-2.5" />
              Isolated
            </span>
          ) : (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono">
              Inspect <ArrowRight className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/80 transition-all group-hover:!bg-cyan-400 group-hover:scale-125"
      />
    </div>
  );
}

export default memo(DependencyNode);

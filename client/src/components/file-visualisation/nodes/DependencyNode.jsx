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
  ".js": { text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", accent: "#f59e0b" },
  ".jsx": { text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/10", accent: "#06b6d4" },
  ".ts": { text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", accent: "#3b82f6" },
  ".tsx": { text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/40", bg: "bg-indigo-500/10", accent: "#6366f1" },
  ".mjs": { text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10", accent: "#10b981" },
  ".cjs": { text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10", accent: "#f97316" },
};

function DependencyNode({ data, selected }) {
  const extStyle = EXT_COLORS[data.extension] || {
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/40",
    bg: "bg-zinc-500/10",
    accent: "#71717a",
  };

  const isCircular = data.isCircular;
  const isIsolated = data.incomingCount === 0 && data.outgoingCount === 0;

  return (
    <div
      className={`group relative w-[260px] h-[85px] rounded-xl border-2 transition-all duration-150 select-none flex flex-col justify-between p-2.5 ${
        isCircular
          ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-4 ring-rose-500/20 shadow-md scale-[1.01]"
          : selected
            ? "border-amber-500 ring-4 ring-amber-500/20 shadow-xl scale-[1.02] z-20"
            : "border-slate-200 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500 shadow-sm hover:shadow-md hover:scale-[1.01]"
      }`}
      style={{
        backgroundColor: "var(--card)",
      }}
    >
      {/* Left colored extension strip */}
      <div
        className="absolute left-0 inset-y-0 w-1.5 rounded-l-[10px]"
        style={{ backgroundColor: isCircular ? "#f43f5e" : extStyle.accent }}
      />

      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-3 !w-3 !border-2 !border-background !bg-slate-400 dark:!bg-zinc-400 group-hover:!bg-cyan-400 transition-transform group-hover:scale-125"
      />

      {/* Header: File Name and Extension Badge */}
      <div className="flex items-center justify-between gap-1.5 pl-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border"
            style={{
              backgroundColor: extStyle.bg,
              borderColor: extStyle.border,
            }}
          >
            <FileCode className={`h-3 w-3 ${extStyle.text}`} />
          </div>

          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono truncate">
            {data.label}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${extStyle.text} ${extStyle.border} ${extStyle.bg}`}
        >
          {data.extension || "code"}
        </span>
      </div>

      {/* Path preview */}
      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate pl-1 font-medium" title={data.path}>
        {data.path}
      </p>

      {/* Stats footer: Incoming / Outgoing pills & Flags */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[10px] pl-1">
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20"
            title={`${data.incomingCount} files import this`}
          >
            <ArrowDownLeft className="h-3 w-3" />
            <span>{data.incomingCount}</span>
          </span>

          <span
            className="flex items-center gap-0.5 text-blue-600 dark:text-sky-400 font-mono font-semibold px-1 py-0.2 rounded bg-blue-500/10 border border-blue-500/20"
            title={`Imports ${data.outgoingCount} files`}
          >
            <ArrowUpRight className="h-3 w-3" />
            <span>{data.outgoingCount}</span>
          </span>
        </div>

        {isCircular ? (
          <span className="flex items-center gap-1 font-mono text-[9px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">
            <AlertTriangle className="h-2.5 w-2.5" />
            Cycle
          </span>
        ) : isIsolated ? (
          <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20">
            <Radio className="h-2.5 w-2.5" />
            Isolated
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-sans font-semibold">
            Details <ArrowRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-background !bg-slate-400 dark:!bg-zinc-400 group-hover:!bg-cyan-400 transition-transform group-hover:scale-125"
      />
    </div>
  );
}

export default memo(DependencyNode);

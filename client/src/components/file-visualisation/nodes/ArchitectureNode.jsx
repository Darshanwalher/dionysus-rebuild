import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "@/lib/graphStyles";
import { FileText, ArrowUpRight } from "lucide-react";

function ArchitectureNode({ data, selected }) {
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  return (
    <div
      className={`group relative w-[270px] h-[105px] rounded-xl border-2 transition-all duration-150 select-none flex flex-col justify-between p-3 ${
        selected
          ? "border-amber-500 ring-4 ring-amber-500/20 shadow-xl scale-[1.02] z-20"
          : "border-slate-200 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500 shadow-sm hover:shadow-md hover:scale-[1.01]"
      }`}
      style={{
        backgroundColor: "var(--card)",
      }}
    >
      {/* Left colored category strip */}
      <div
        className="absolute left-0 inset-y-0 w-1.5 rounded-l-[10px]"
        style={{ backgroundColor: meta.color }}
      />

      {/* Target connection handle */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-3 !w-3 !border-2 !border-background !bg-slate-400 dark:!bg-zinc-400 group-hover:!bg-amber-400 transition-transform group-hover:scale-125"
      />

      {/* Header: Icon, Label, and Type Badge */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border shadow-2xs"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight">
              {data.label}
            </h4>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Responsibility text with high contrast */}
      <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-snug pl-1 font-medium">
        {data.responsibility || data.description || "Core application component."}
      </p>

      {/* Footer: Monospace Path and Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-zinc-800/80 text-[10px] font-mono text-slate-500 dark:text-zinc-400 pl-1">
        <span className="flex items-center gap-1 truncate max-w-[190px]" title={data.path}>
          <FileText className="h-3 w-3 flex-shrink-0 opacity-70" />
          <span className="truncate">{data.path || "virtual"}</span>
        </span>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-slate-800 dark:text-slate-200 font-sans font-semibold">
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>

      {/* Source connection handle */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-background !bg-slate-400 dark:!bg-zinc-400 group-hover:!bg-amber-400 transition-transform group-hover:scale-125"
      />
    </div>
  );
}

export default memo(ArchitectureNode);

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "@/lib/graphStyles";
import { FileText, ArrowUpRight } from "lucide-react";

function ArchitectureNode({ data, selected }) {
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  return (
    <div
      className={`group relative w-[290px] rounded-xl border transition-all duration-200 select-none ${
        selected
          ? "border-amber-400/90 ring-2 ring-amber-400/25 shadow-xl shadow-amber-500/10 scale-[1.02]"
          : "border-border/60 hover:border-border/90 hover:shadow-xl hover:scale-[1.01]"
      }`}
      style={{
        background: "color-mix(in oklch, var(--card) 92%, transparent)",
        backdropFilter: "blur(16px)",
        boxShadow: selected
          ? `0 0 20px ${meta.glow}, 0 8px 24px -4px rgba(0,0,0,0.4)`
          : "0 4px 20px -2px rgba(0,0,0,0.25)",
      }}
    >
      {/* Top ambient highlight line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] rounded-t-xl opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }}
      />

      {/* Target connection handle */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/80 transition-all group-hover:!bg-amber-400 group-hover:scale-125"
      />

      <div className="p-3.5 space-y-2.5">
        {/* Header: Icon, Label, and Type Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border shadow-xs"
              style={{
                backgroundColor: meta.bg,
                borderColor: meta.border,
                color: meta.color,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-foreground tracking-tight truncate leading-tight">
                {data.label}
              </h4>
              {data.groupLabel && (
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block truncate">
                  {data.groupLabel}
                </span>
              )}
            </div>
          </div>

          <span
            className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Short description */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {data.responsibility || data.description || "Core application component."}
        </p>

        {/* Path Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate max-w-[210px]" title={data.path}>
            <FileText className="h-3 w-3 flex-shrink-0 opacity-60" />
            <span className="truncate">{data.path || "virtual component"}</span>
          </span>

          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-foreground">
            Inspect <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>

      {/* Source connection handle */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground/80 transition-all group-hover:!bg-amber-400 group-hover:scale-125"
      />
    </div>
  );
}

export default memo(ArchitectureNode);

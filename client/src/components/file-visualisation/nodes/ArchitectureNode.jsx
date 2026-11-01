import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "@/lib/graphStyles";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

function ArchitectureNode({ data, selected }) {
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  return (
    <div
      className={`relative w-[280px] rounded-xl border p-3.5 shadow-lg transition-all duration-200 select-none ${
        selected
          ? "border-amber-400/80 ring-2 ring-amber-400/30 shadow-amber-500/10"
          : "border-border/60 hover:border-border hover:shadow-xl"
      }`}
      style={{
        background: "var(--card)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-amber-400 transition-transform hover:scale-125"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-foreground truncate">
            {data.label}
          </span>
        </div>

        <Badge
          variant="outline"
          className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0 border ${meta.badge}`}
        >
          {meta.label}
        </Badge>
      </div>

      {/* Description / Responsibility */}
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2.5">
        {data.responsibility || data.description || "Core application component."}
      </p>

      {/* Footer with Group and File Path */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1 font-mono truncate max-w-[170px]" title={data.path}>
          <FileText className="h-3 w-3 flex-shrink-0 opacity-70" />
          <span className="truncate">{data.path || "virtual"}</span>
        </span>

        {data.groupLabel && (
          <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
            {data.groupLabel}
          </span>
        )}
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-amber-400 transition-transform hover:scale-125"
      />
    </div>
  );
}

export default memo(ArchitectureNode);

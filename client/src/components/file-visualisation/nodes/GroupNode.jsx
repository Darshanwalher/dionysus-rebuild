import React, { memo } from "react";
import {
  Layout,
  Server,
  Database,
  Cpu,
  Globe,
  Boxes,
  Workflow,
  Sparkles,
  Shield,
} from "lucide-react";

const GROUP_ICONS = {
  frontend: Layout,
  client: Layout,
  ui: Layout,
  backend: Server,
  server: Server,
  api: Server,
  database: Database,
  db: Database,
  models: Database,
  services: Cpu,
  service: Cpu,
  ai: Sparkles,
  external: Globe,
  auth: Shield,
  workers: Workflow,
};

const GROUP_PALETTES = {
  frontend: {
    border: "border-sky-500/40",
    bg: "bg-sky-500/5",
    headerBg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  backend: {
    border: "border-purple-500/40",
    bg: "bg-purple-500/5",
    headerBg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
  database: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    headerBg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  ai: {
    border: "border-fuchsia-500/40",
    bg: "bg-fuchsia-500/5",
    headerBg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    badge: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
  },
  services: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    headerBg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  external: {
    border: "border-rose-500/40",
    bg: "bg-rose-500/5",
    headerBg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
};

function getGroupPalette(groupId = "") {
  const clean = groupId.toLowerCase();
  for (const [key, palette] of Object.entries(GROUP_PALETTES)) {
    if (clean.includes(key)) return palette;
  }
  return {
    border: "border-border/80",
    bg: "bg-muted/30",
    headerBg: "bg-muted/60",
    text: "text-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  };
}

function getGroupIcon(groupId = "") {
  const clean = groupId.toLowerCase();
  for (const [key, Icon] of Object.entries(GROUP_ICONS)) {
    if (clean.includes(key)) return Icon;
  }
  return Boxes;
}

function GroupNode({ data }) {
  const palette = getGroupPalette(data.id || data.label);
  const Icon = getGroupIcon(data.id || data.label);

  return (
    <div
      className={`rounded-2xl border-2 transition-all select-none pointer-events-none ${palette.border} ${palette.bg}`}
      style={{
        width: data.width || 600,
        height: data.height || 400,
        boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Group Header Banner */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-t-[14px] border-b border-border/40 ${palette.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-card/80 border border-border/50 shadow-2xs">
            <Icon className={`h-3.5 w-3.5 ${palette.text}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-foreground uppercase">
              {data.label}
            </h3>
            {data.description && (
              <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                {data.description}
              </p>
            )}
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${palette.badge}`}
        >
          {data.count || 0} component{data.count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default memo(GroupNode);

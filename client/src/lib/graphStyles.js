import {
  Server,
  Database,
  Cpu,
  Shield,
  Route,
  Globe,
  Settings,
  Layout,
  Component,
  FileCode,
  HardDrive,
  Workflow,
  Sparkles,
} from "lucide-react";

export const COMPONENT_TYPE_META = {
  component: {
    label: "Component",
    icon: Component,
    color: "#38bdf8", // Sky blue
    bg: "rgba(56, 189, 248, 0.10)",
    border: "rgba(56, 189, 248, 0.35)",
    glow: "rgba(56, 189, 248, 0.20)",
    badge: "border-sky-500/30 text-sky-400 bg-sky-500/10",
  },
  page: {
    label: "Page / View",
    icon: Layout,
    color: "#818cf8", // Indigo
    bg: "rgba(129, 140, 248, 0.10)",
    border: "rgba(129, 140, 248, 0.35)",
    glow: "rgba(129, 140, 248, 0.20)",
    badge: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
  },
  controller: {
    label: "Controller",
    icon: Server,
    color: "#c084fc", // Purple
    bg: "rgba(192, 132, 252, 0.10)",
    border: "rgba(192, 132, 252, 0.35)",
    glow: "rgba(192, 132, 252, 0.20)",
    badge: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  },
  service: {
    label: "Service",
    icon: Cpu,
    color: "#34d399", // Emerald
    bg: "rgba(52, 211, 153, 0.10)",
    border: "rgba(52, 211, 153, 0.35)",
    glow: "rgba(52, 211, 153, 0.20)",
    badge: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
  model: {
    label: "Model / Schema",
    icon: Database,
    color: "#fbbf24", // Amber
    bg: "rgba(251, 191, 36, 0.10)",
    border: "rgba(251, 191, 36, 0.35)",
    glow: "rgba(251, 191, 36, 0.20)",
    badge: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  middleware: {
    label: "Middleware",
    icon: Shield,
    color: "#fb923c", // Orange
    bg: "rgba(251, 146, 60, 0.10)",
    border: "rgba(251, 146, 60, 0.35)",
    glow: "rgba(251, 146, 60, 0.20)",
    badge: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  },
  route: {
    label: "Route / API",
    icon: Route,
    color: "#22d3ee", // Cyan
    bg: "rgba(34, 211, 238, 0.10)",
    border: "rgba(34, 211, 238, 0.35)",
    glow: "rgba(34, 211, 238, 0.20)",
    badge: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  },
  database: {
    label: "Database",
    icon: HardDrive,
    color: "#facc15", // Yellow
    bg: "rgba(250, 204, 21, 0.10)",
    border: "rgba(250, 204, 21, 0.35)",
    glow: "rgba(250, 204, 21, 0.20)",
    badge: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  },
  external: {
    label: "External Service",
    icon: Globe,
    color: "#f472b6", // Pink
    bg: "rgba(244, 114, 182, 0.10)",
    border: "rgba(244, 114, 182, 0.35)",
    glow: "rgba(244, 114, 182, 0.20)",
    badge: "border-pink-500/30 text-pink-400 bg-pink-500/10",
  },
  worker: {
    label: "Background Worker",
    icon: Workflow,
    color: "#2dd4bf", // Teal
    bg: "rgba(45, 212, 191, 0.10)",
    border: "rgba(45, 212, 191, 0.35)",
    glow: "rgba(45, 212, 191, 0.20)",
    badge: "border-teal-500/30 text-teal-400 bg-teal-500/10",
  },
  ai: {
    label: "AI / LLM Service",
    icon: Sparkles,
    color: "#e879f9", // Fuchsia
    bg: "rgba(232, 121, 249, 0.10)",
    border: "rgba(232, 121, 249, 0.35)",
    glow: "rgba(232, 121, 249, 0.20)",
    badge: "border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10",
  },
  config: {
    label: "Configuration",
    icon: Settings,
    color: "#a1a1aa", // Zinc
    bg: "rgba(161, 161, 170, 0.10)",
    border: "rgba(161, 161, 170, 0.35)",
    glow: "rgba(161, 161, 170, 0.15)",
    badge: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
  },
};

export const getComponentMeta = (type) => {
  const cleanType = String(type || "component").toLowerCase();
  return COMPONENT_TYPE_META[cleanType] || {
    label: type || "Component",
    icon: FileCode,
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.10)",
    border: "rgba(148, 163, 184, 0.35)",
    glow: "rgba(148, 163, 184, 0.15)",
    badge: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  };
};

export const EDGE_TYPE_STYLES = {
  api: {
    stroke: "#38bdf8",
    strokeWidth: 2,
    strokeDasharray: "none",
    animated: true,
  },
  auth: {
    stroke: "#fb923c",
    strokeWidth: 2,
    strokeDasharray: "5 4",
    animated: true,
  },
  database: {
    stroke: "#fbbf24",
    strokeWidth: 2.2,
    strokeDasharray: "4 3",
    animated: false,
  },
  event: {
    stroke: "#c084fc",
    strokeWidth: 1.8,
    strokeDasharray: "6 4",
    animated: true,
  },
  import: {
    stroke: "#64748b",
    strokeWidth: 1.5,
    strokeDasharray: "4 4",
    animated: false,
  },
  data_flow: {
    stroke: "#94a3b8",
    strokeWidth: 1.5,
    strokeDasharray: "none",
    animated: false,
  },
};

export const getEdgeStyle = (type, isHighlighted = false, isCircular = false) => {
  if (isCircular) {
    return {
      stroke: "#f43f5e",
      strokeWidth: 2.5,
      strokeDasharray: "6 3",
      animated: true,
    };
  }

  if (isHighlighted) {
    return {
      stroke: "#f59e0b",
      strokeWidth: 2.5,
      strokeDasharray: "none",
      animated: true,
    };
  }

  const clean = String(type || "data_flow").toLowerCase();
  return EDGE_TYPE_STYLES[clean] || EDGE_TYPE_STYLES.data_flow;
};

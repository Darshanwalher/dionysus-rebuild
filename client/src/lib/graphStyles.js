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
    color: "#3b82f6", // blue
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.4)",
    badge: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  },
  page: {
    label: "Page / View",
    icon: Layout,
    color: "#8b5cf6", // purple
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.4)",
    badge: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  },
  controller: {
    label: "Controller",
    icon: Server,
    color: "#a855f7", // violet
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.4)",
    badge: "border-violet-500/30 text-violet-400 bg-violet-500/10",
  },
  service: {
    label: "Service",
    icon: Cpu,
    color: "#10b981", // emerald
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.4)",
    badge: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
  model: {
    label: "Model / Schema",
    icon: Database,
    color: "#f59e0b", // amber
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.4)",
    badge: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  middleware: {
    label: "Middleware",
    icon: Shield,
    color: "#f97316", // orange
    bg: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.4)",
    badge: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  },
  route: {
    label: "Route / Endpoint",
    icon: Route,
    color: "#06b6d4", // cyan
    bg: "rgba(6, 182, 212, 0.12)",
    border: "rgba(6, 182, 212, 0.4)",
    badge: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  },
  database: {
    label: "Database",
    icon: HardDrive,
    color: "#eab308", // yellow
    bg: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.4)",
    badge: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  },
  external: {
    label: "External Service",
    icon: Globe,
    color: "#ec4899", // pink
    bg: "rgba(236, 72, 153, 0.12)",
    border: "rgba(236, 72, 153, 0.4)",
    badge: "border-pink-500/30 text-pink-400 bg-pink-500/10",
  },
  worker: {
    label: "Background Worker",
    icon: Workflow,
    color: "#14b8a6", // teal
    bg: "rgba(20, 184, 166, 0.12)",
    border: "rgba(20, 184, 166, 0.4)",
    badge: "border-teal-500/30 text-teal-400 bg-teal-500/10",
  },
  ai: {
    label: "AI / ML Service",
    icon: Sparkles,
    color: "#d946ef", // fuchsia
    bg: "rgba(217, 70, 239, 0.12)",
    border: "rgba(217, 70, 239, 0.4)",
    badge: "border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10",
  },
  config: {
    label: "Configuration",
    icon: Settings,
    color: "#71717a", // zinc
    bg: "rgba(113, 113, 122, 0.12)",
    border: "rgba(113, 113, 122, 0.4)",
    badge: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
  },
};

export const getComponentMeta = (type) => {
  const cleanType = String(type || "component").toLowerCase();
  return COMPONENT_TYPE_META[cleanType] || {
    label: type || "Component",
    icon: FileCode,
    color: "#a1a1aa",
    bg: "rgba(161, 161, 170, 0.12)",
    border: "rgba(161, 161, 170, 0.4)",
    badge: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
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
    stroke: "#f97316",
    strokeWidth: 2,
    strokeDasharray: "4 3",
    animated: true,
  },
  database: {
    stroke: "#eab308",
    strokeWidth: 2.2,
    strokeDasharray: "3 2",
    animated: false,
  },
  event: {
    stroke: "#a855f7",
    strokeWidth: 1.8,
    strokeDasharray: "5 4",
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
      stroke: "#ef4444",
      strokeWidth: 2.5,
      strokeDasharray: "5 3",
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

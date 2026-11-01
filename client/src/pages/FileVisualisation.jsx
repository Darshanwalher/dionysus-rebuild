import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProject,
  generateArchitecture,
  generateDependencies,
} from "@/store/slices/projectSlice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderTree,
  Maximize2,
  Minimize2,
  Network,
  ListTree,
  Boxes,
  GitBranch,
  ExternalLink,
  GitFork,
} from "lucide-react";
import { parseFileTree } from "@/lib/fileTree";
import FileTreeExplorer from "@/components/file-visualisation/FileTreeExplorer";
import ArchitectureMap from "@/components/file-visualisation/ArchitectureMap";
import ArchitectureOverview from "@/components/file-visualisation/ArchitectureOverview";
import DependencyGraph from "@/components/file-visualisation/DependencyGraph";

export default function FileVisualisation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    currentProject,
    isLoading,
    architectureGraph,
    dependencyGraph,
    isArchitectureLoading,
    isDependencyLoading,
    architectureError,
    dependencyError,
  } = useSelector((state) => state.project);

  const [viewMode, setViewMode] = useState("architecture");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  // Load architecture when user enters architecture tab if not already present
  useEffect(() => {
    if (
      viewMode === "architecture" &&
      currentProject?.githubUrl &&
      !currentProject?.architectureGraph &&
      !architectureGraph &&
      !isArchitectureLoading
    ) {
      dispatch(generateArchitecture({ projectId: id, force: false }));
    }
  }, [viewMode, currentProject, architectureGraph, isArchitectureLoading, dispatch, id]);

  // Load dependencies when user enters dependencies tab if not already present
  useEffect(() => {
    if (
      viewMode === "dependencies" &&
      currentProject?.githubUrl &&
      !currentProject?.dependencyGraph &&
      !dependencyGraph &&
      !isDependencyLoading
    ) {
      dispatch(generateDependencies({ projectId: id, force: false }));
    }
  }, [viewMode, currentProject, dependencyGraph, isDependencyLoading, dispatch, id]);

  const handleRefreshArchitecture = useCallback(
    (force = true) => {
      dispatch(generateArchitecture({ projectId: id, force }));
    },
    [dispatch, id]
  );

  const handleRefreshDependencies = useCallback(
    (force = true) => {
      dispatch(generateDependencies({ projectId: id, force }));
    },
    [dispatch, id]
  );

  const fileTree = useMemo(
    () => parseFileTree(currentProject?.mermaidGraph, currentProject?.name || "Repository"),
    [currentProject]
  );

  const currentArchitectureData = architectureGraph || currentProject?.architectureGraph;
  const currentDependencyData = dependencyGraph || currentProject?.dependencyGraph;

  const repoDisplay = useMemo(() => {
    if (!currentProject?.githubUrl) return null;
    const clean = currentProject.githubUrl.replace(/\.git$/i, "").replace(/^https?:\/\/github\.com\//i, "");
    return clean;
  }, [currentProject?.githubUrl]);

  const modes = [
    { key: "architecture", label: "Architecture", icon: Boxes, accent: "text-amber-400" },
    { key: "dependencies", label: "Dependencies", icon: GitBranch, accent: "text-cyan-400" },
    { key: "tree", label: "Tree", icon: ListTree, accent: "text-emerald-400" },
    { key: "diagram", label: "Diagram", icon: Network, accent: "text-indigo-400" },
  ];

  if (isLoading && !currentProject) {
    return (
      <div className="flex flex-col h-[calc(100vh-3rem)] -my-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-8 w-72 rounded-lg" />
        </div>
        <Skeleton className="flex-1 m-0 rounded-none" />
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-background flex flex-col"
          : "flex flex-col -my-8 -mx-4 sm:-mx-6 lg:-mx-8"
      }
      style={!isFullscreen ? { height: "calc(100vh - 3rem)" } : undefined}
    >
      {/* ─── Compact Toolbar Header ─── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/60 backdrop-blur-md flex-shrink-0">
        {/* Left: Repo pill */}
        <div className="flex items-center gap-3 min-w-0">
          {repoDisplay ? (
            <a
              href={currentProject.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-all"
              title="View on GitHub"
            >
              <GitFork className="h-3 w-3 text-amber-400 flex-shrink-0" />
              <span className="truncate max-w-[140px]">{repoDisplay}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-50 flex-shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FolderTree className="h-3.5 w-3.5" />
              <span className="font-medium">Code Visualisation</span>
            </div>
          )}
        </div>

        {/* Center: Mode Selector */}
        <div className="flex items-center p-0.5 rounded-lg border border-border/50 bg-background/60 shadow-xs">
          {modes.map((m) => {
            const MIcon = m.icon;
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setViewMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  active
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={m.label}
              >
                <MIcon className={`h-3.5 w-3.5 ${active ? m.accent : ""}`} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Fullscreen */}
        <button
          className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ─── Canvas Area (fills remaining height) ─── */}
      {currentProject?.githubUrl ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === "architecture" && (
            <ArchitectureOverview
              architectureData={currentArchitectureData}
              githubUrl={currentProject.githubUrl}
              isLoading={isArchitectureLoading}
              error={architectureError}
              onRefresh={handleRefreshArchitecture}
              isFullscreen={isFullscreen}
            />
          )}

          {viewMode === "dependencies" && (
            <DependencyGraph
              dependencyData={currentDependencyData}
              githubUrl={currentProject.githubUrl}
              isLoading={isDependencyLoading}
              error={dependencyError}
              onRefresh={handleRefreshDependencies}
              isFullscreen={isFullscreen}
            />
          )}

          {viewMode === "tree" && (
            <FileTreeExplorer
              fileTree={fileTree}
              githubUrl={currentProject.githubUrl}
              isFullscreen={isFullscreen}
            />
          )}

          {viewMode === "diagram" && (
            <ArchitectureMap
              fileTree={fileTree}
              githubUrl={currentProject.githubUrl}
              isFullscreen={isFullscreen}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm space-y-4 animate-fade-up">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center">
              <FolderTree className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                No Repository Connected
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect a GitHub repository in Project Settings to generate architecture diagrams and dependency graphs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

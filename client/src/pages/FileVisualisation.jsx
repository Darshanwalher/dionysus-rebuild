import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProject,
  generateArchitecture,
  generateDependencies,
} from "@/store/slices/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import PageHeader from "@/components/layout/PageHeader";

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
    if (!currentProject || currentProject._id !== id) {
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

  if (isLoading && !currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-[680px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      {/* Editorial Header */}
      <PageHeader
        icon={FolderTree}
        title="Code & Architecture Visualisation"
        description="Comprehensive GitDiagram architecture map, deterministic code dependency graph, and hierarchical file tree"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project / Repo Pill */}
            {repoDisplay && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card/60 hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                title="View linked repository on GitHub"
              >
                <GitFork className="h-3.5 w-3.5 text-amber-400" />
                <span className="truncate max-w-[160px]">{repoDisplay}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}

            {/* Mode Selector Segmented Tabs */}
            <div className="flex items-center p-1 rounded-xl border border-border/60 bg-card/70 backdrop-blur-md shadow-xs">
              <button
                onClick={() => setViewMode("architecture")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "architecture"
                    ? "bg-muted text-foreground font-semibold shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="GitDiagram-Style Architecture Overview"
              >
                <Boxes className={`h-3.5 w-3.5 ${viewMode === "architecture" ? "text-amber-400" : "text-muted-foreground"}`} />
                <span>Architecture</span>
              </button>

              <button
                onClick={() => setViewMode("dependencies")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "dependencies"
                    ? "bg-muted text-foreground font-semibold shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Static Source Code Dependency Graph"
              >
                <GitBranch className={`h-3.5 w-3.5 ${viewMode === "dependencies" ? "text-cyan-400" : "text-muted-foreground"}`} />
                <span>Dependencies</span>
              </button>

              <button
                onClick={() => setViewMode("tree")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "tree"
                    ? "bg-muted text-foreground font-semibold shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Hierarchical File Tree Explorer"
              >
                <ListTree className="h-3.5 w-3.5" />
                <span>Tree</span>
              </button>

              <button
                onClick={() => setViewMode("diagram")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "diagram"
                    ? "bg-muted text-foreground font-semibold shadow-xs ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mermaid Directory Diagram View"
              >
                <Network className="h-3.5 w-3.5" />
                <span>Diagram</span>
              </button>
            </div>

            {/* Fullscreen Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 border-border/60 text-muted-foreground hover:text-foreground rounded-lg shadow-2xs"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        }
      />

      {/* Main Canvas Card */}
      {currentProject?.githubUrl ? (
        <Card className="glass-premium overflow-hidden rounded-2xl border-border/60 shadow-xl animate-fade-up">
          <CardContent className="p-0">
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
              <FileTreeExplorer fileTree={fileTree} isFullscreen={isFullscreen} />
            )}

            {viewMode === "diagram" && (
              <ArchitectureMap fileTree={fileTree} isFullscreen={isFullscreen} />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50 rounded-2xl animate-fade-up">
          <CardContent className="py-20 text-center max-w-lg mx-auto space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center shadow-xs">
              <FolderTree className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                No GitHub Repository Connected
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect a GitHub repository in Project Settings or the project overview to automatically synthesize your architecture diagram and map complete code dependencies.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

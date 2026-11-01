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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderTree,
  Maximize2,
  Minimize2,
  Network,
  ListTree,
  Boxes,
  GitBranch,
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

  if (isLoading && !currentProject) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      <PageHeader
        icon={FolderTree}
        title="Code & Architecture Visualisation"
        description="Interactive GitDiagram architecture overview, source code dependency graph, and hierarchical file tree"
        actions={
          <>
            {currentProject?.name && (
              <Badge variant="outline" className="border-border/60 text-xs font-mono text-muted-foreground bg-background/50">
                {currentProject.name}
              </Badge>
            )}

            {/* Mode Selector Tabs */}
            <div className="flex items-center p-1 rounded-lg border border-border/60 bg-card/60 flex-wrap gap-0.5">
              <button
                onClick={() => setViewMode("architecture")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "architecture"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="GitDiagram-Style Architecture Overview"
              >
                <Boxes className="h-3.5 w-3.5 text-amber-400" />
                Architecture
              </button>

              <button
                onClick={() => setViewMode("dependencies")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "dependencies"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Source Code Dependency Graph"
              >
                <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                Dependencies
              </button>

              <button
                onClick={() => setViewMode("tree")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "tree"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Hierarchical File Tree Explorer"
              >
                <ListTree className="h-3.5 w-3.5" />
                Tree Explorer
              </button>

              <button
                onClick={() => setViewMode("diagram")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "diagram"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mermaid Directory Diagram View"
              >
                <Network className="h-3.5 w-3.5" />
                Directory Diagram
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 border-border/60 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </>
        }
      />

      {currentProject?.githubUrl ? (
        <Card className="glass-premium overflow-hidden animate-fade-up">
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
        <Card className="glass border-border/50 animate-fade-up">
          <CardContent className="py-16 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold mb-1 text-foreground">No repository connected</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Link a GitHub repository to this project to unlock AI architecture visualization and static dependency graph mapping.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

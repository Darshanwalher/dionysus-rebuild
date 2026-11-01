import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  RefreshCw,
  ArrowDownUp,
  ArrowLeftRight,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  Search,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  CornerDownRight,
} from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  buildMermaidFromTree,
  findNodeById,
  getPathToNode,
  filterNoise,
  countStats,
} from "@/lib/fileTree";

const MERMAID_FONT = "'JetBrains Mono', 'Plus Jakarta Sans', Inter, system-ui, sans-serif";

const MERMAID_PALETTES = {
  dark: {
    themeVariables: {
      darkMode: true,
      background: "transparent",
      primaryColor: "#1e293b",
      primaryTextColor: "#f8fafc",
      primaryBorderColor: "#f59e0b",
      lineColor: "#64748b",
      secondaryColor: "#0f172a",
      tertiaryColor: "#020617",
      mainBkg: "#0f172a",
      nodeBorder: "#334155",
      nodeTextColor: "#f1f5f9",
      edgeLabelBackground: "#0f172a",
      fontSize: "12px",
      fontFamily: MERMAID_FONT,
    },
    classDefs: `
  classDef root fill:#0f172a,stroke:#f59e0b,stroke-width:2.5px,color:#ffffff,rx:8px,ry:8px;
  classDef folder fill:#1e293b,stroke:#eab308,stroke-width:1.8px,color:#f8fafc,rx:8px,ry:8px;
  classDef file fill:#0f172a,stroke:#38bdf8,stroke-width:1.2px,color:#cbd5e1,rx:6px,ry:6px;
  linkStyle default stroke:#64748b,stroke-width:1.5px;
`,
  },
  light: {
    themeVariables: {
      darkMode: false,
      background: "transparent",
      primaryColor: "#f8fafc",
      primaryTextColor: "#0f172a",
      primaryBorderColor: "#d97706",
      lineColor: "#94a3b8",
      secondaryColor: "#ffffff",
      tertiaryColor: "#f1f5f9",
      mainBkg: "#ffffff",
      nodeBorder: "#cbd5e1",
      nodeTextColor: "#1e293b",
      edgeLabelBackground: "#ffffff",
      fontSize: "12px",
      fontFamily: MERMAID_FONT,
    },
    classDefs: `
  classDef root fill:#ffffff,stroke:#d97706,stroke-width:2.5px,color:#0f172a,rx:8px,ry:8px;
  classDef folder fill:#ffffff,stroke:#f59e0b,stroke-width:1.8px,color:#0f172a,rx:8px,ry:8px;
  classDef file fill:#f8fafc,stroke:#0284c7,stroke-width:1.2px,color:#334155,rx:6px,ry:6px;
  linkStyle default stroke:#94a3b8,stroke-width:1.5px;
`,
  },
};

function initMermaid(resolvedTheme) {
  const palette = MERMAID_PALETTES[resolvedTheme] || MERMAID_PALETTES.dark;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: palette.themeVariables,
  });
}

function extractNodeId(svgNode) {
  const raw = svgNode.getAttribute("id") || svgNode.getAttribute("data-id") || "";
  const match = raw.match(/^(?:flowchart-)?([A-Za-z0-9_]+?)(?:-\d+)?$/);
  return match ? match[1] : raw || null;
}

function getFileIcon(name = "") {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "rs", "go"].includes(ext)) return FileCode;
  if (["json", "jsonc"].includes(ext)) return FileJson;
  if (["md", "mdx", "txt", "yml", "yaml"].includes(ext)) return FileText;
  return File;
}

export default function ArchitectureMap({ fileTree, githubUrl }) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mermaidRef = useRef(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [orientation, setOrientation] = useState("TD");
  const [maxDepth, setMaxDepth] = useState(2);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [hideNoise, setHideNoise] = useState(true);
  const [focusNodeId, setFocusNodeId] = useState(fileTree?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [copiedPath, setCopiedPath] = useState(false);

  useEffect(() => {
    setFocusNodeId(fileTree?.id || null);
  }, [fileTree]);

  // Escape key closes inspector
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter tree based on vendor / noise toggle
  const filteredTree = useMemo(() => {
    return filterNoise(fileTree, hideNoise);
  }, [fileTree, hideNoise]);

  const focusNode = useMemo(
    () => findNodeById(filteredTree, focusNodeId) || filteredTree,
    [filteredTree, focusNodeId]
  );

  const breadcrumbs = useMemo(
    () => getPathToNode(filteredTree, focusNode?.id) || (filteredTree ? [filteredTree] : []),
    [filteredTree, focusNode]
  );

  const stats = useMemo(() => countStats(focusNode), [focusNode]);

  const processedGraph = useMemo(() => {
    const palette = MERMAID_PALETTES[resolvedTheme] || MERMAID_PALETTES.dark;
    return buildMermaidFromTree(focusNode, {
      maxDepth,
      includeFiles,
      orientation,
      classDefs: palette.classDefs,
      nodeCap: 80,
    });
  }, [focusNode, maxDepth, includeFiles, orientation, resolvedTheme]);

  const drillInto = useCallback(
    (nodeId) => {
      if (!nodeId || nodeId.endsWith("_more")) return;
      const target = findNodeById(filteredTree, nodeId);
      if (!target || target.type !== "folder") return;
      if (target.id === focusNode?.id) return;
      setFocusNodeId(target.id);
      setSelectedNode(target);
      setPan({ x: 0, y: 0 });
      setZoom(0.85);
    },
    [filteredTree, focusNode]
  );

  // Render Mermaid and attach rich click/selection handlers
  useEffect(() => {
    let isMounted = true;
    const renderMermaid = async () => {
      if (!processedGraph || !mermaidRef.current) return;
      setIsRendering(true);
      setRenderError(null);
      try {
        initMermaid(resolvedTheme);
        const uniqueId = `mermaid-svg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        mermaidRef.current.innerHTML = "";
        const { svg } = await mermaid.render(uniqueId, processedGraph);
        if (isMounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          const svgEl = mermaidRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.display = "block";
            svgEl.removeAttribute("width");
            svgEl.removeAttribute("height");
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
          }

          // Attach listeners to SVG nodes
          mermaidRef.current.querySelectorAll(".node").forEach((el) => {
            const nodeId = extractNodeId(el);
            const target = findNodeById(filteredTree, nodeId);
            if (!target) return;

            el.style.cursor = "pointer";
            el.setAttribute("title", `${target.name} (${target.type})`);

            // Single click selects node and opens detail panel
            el.addEventListener("click", (event) => {
              event.stopPropagation();
              setSelectedNode(target);
            });

            // Double click drills into folder
            if (target.type === "folder" && target.id !== focusNode?.id) {
              el.addEventListener("dblclick", (event) => {
                event.stopPropagation();
                drillInto(nodeId);
              });
            }
          });
        }
      } catch (error) {
        console.error("Mermaid render error:", error);
        if (isMounted) setRenderError(error.message || "Failed to render visual diagram");
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };
    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [processedGraph, resolvedTheme, drillInto, filteredTree, focusNode]);

  // Live search highlighting on rendered SVG nodes
  useEffect(() => {
    if (!mermaidRef.current) return;
    const q = searchTerm.trim().toLowerCase();
    const svgNodes = mermaidRef.current.querySelectorAll(".node");

    svgNodes.forEach((el) => {
      const nodeId = extractNodeId(el);
      const target = findNodeById(filteredTree, nodeId);
      const isSelected = selectedNode && selectedNode.id === nodeId;

      if (!target) return;

      const matchesSearch = !q || target.name.toLowerCase().includes(q) || (target.path && target.path.toLowerCase().includes(q));

      if (isSelected) {
        el.style.filter = "drop-shadow(0 0 10px rgba(245, 158, 11, 0.7))";
        el.style.opacity = "1";
      } else if (q && matchesSearch) {
        el.style.filter = "drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))";
        el.style.opacity = "1";
      } else if (q && !matchesSearch) {
        el.style.filter = "none";
        el.style.opacity = "0.15";
      } else {
        el.style.filter = "none";
        el.style.opacity = "1";
      }
    });
  }, [searchTerm, selectedNode, filteredTree]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom((z) => Math.min(3, Math.max(0.15, z + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  const copyPath = () => {
    if (!selectedNode?.path) return;
    navigator.clipboard.writeText(selectedNode.path);
    setCopiedPath(true);
    toast.success("Path copied to clipboard");
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const getPreparedSVG = useCallback(() => {
    if (!mermaidRef.current) return null;
    const svgEl = mermaidRef.current.querySelector("svg");
    if (!svgEl) return null;

    const cloned = svgEl.cloneNode(true);
    let bbox = { x: 0, y: 0, width: 800, height: 600 };

    try {
      const b = svgEl.getBBox();
      if (b && b.width > 0 && b.height > 0) {
        bbox = b;
      }
    } catch {
      const r = svgEl.getBoundingClientRect();
      bbox = { x: 0, y: 0, width: r.width || 800, height: r.height || 600 };
    }

    const padding = 36;
    const x = Math.floor(bbox.x - padding);
    const y = Math.floor(bbox.y - padding);
    const width = Math.ceil(bbox.width + padding * 2);
    const height = Math.ceil(bbox.height + padding * 2);

    cloned.setAttribute("width", `${width}px`);
    cloned.setAttribute("height", `${height}px`);
    cloned.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloned.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Add solid background rect so exported image has matching theme background
    const bgFill = resolvedTheme === "dark" ? "#090d16" : "#ffffff";
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("x", `${x}`);
    bgRect.setAttribute("y", `${y}`);
    bgRect.setAttribute("width", `${width}`);
    bgRect.setAttribute("height", `${height}`);
    bgRect.setAttribute("fill", bgFill);
    cloned.insertBefore(bgRect, cloned.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(cloned);
    return { svgString, width, height };
  }, [resolvedTheme]);

  const handleDownloadSVG = () => {
    const prepared = getPreparedSVG();
    if (!prepared) {
      toast.error("Could not capture diagram to export");
      return;
    }
    const blob = new Blob([prepared.svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `architecture-diagram-${focusNode?.name || "root"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Architecture diagram downloaded as SVG!");
  };

  const tryBase64Fallback = (svgString, width, height, scale) => {
    try {
      const base64 = window.btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${base64}`;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.error("Could not create canvas context");
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `architecture-diagram-${focusNode?.name || "root"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Architecture diagram downloaded as PNG!");
      };
      img.onerror = (e) => {
        console.error("Base64 fallback error:", e);
        toast.error("Failed to convert diagram to PNG. Please use SVG export.");
      };
      img.src = dataUri;
    } catch (err) {
      console.error("tryBase64Fallback error:", err);
      toast.error("Could not generate PNG. Please use SVG export.");
    }
  };

  const handleDownloadPNG = () => {
    try {
      const prepared = getPreparedSVG();
      if (!prepared) {
        toast.error("Could not capture diagram to export");
        return;
      }

      const { svgString, width, height } = prepared;
      const scale = 2; // Hi-DPI 2x
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Canvas context not available");
        return;
      }

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        try {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(blobUrl);

          const triggerDownload = (uri) => {
            const a = document.createElement("a");
            a.href = uri;
            a.download = `architecture-diagram-${focusNode?.name || "root"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Architecture diagram downloaded as PNG!");
          };

          if (canvas.toBlob) {
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                triggerDownload(url);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
              } else {
                triggerDownload(canvas.toDataURL("image/png"));
              }
            }, "image/png");
          } else {
            triggerDownload(canvas.toDataURL("image/png"));
          }
        } catch (canvasErr) {
          console.error("Canvas rendering error:", canvasErr);
          tryBase64Fallback(svgString, width, height, scale);
        }
      };

      img.onerror = (imgErr) => {
        console.warn("Blob image load failed, trying Base64 fallback...", imgErr);
        URL.revokeObjectURL(blobUrl);
        tryBase64Fallback(svgString, width, height, scale);
      };

      img.src = blobUrl;
    } catch (err) {
      console.error("Download PNG error:", err);
      toast.error("Failed to generate PNG");
    }
  };

  const githubLink = useMemo(() => {
    if (!githubUrl || !selectedNode?.path) return null;
    const cleanUrl = githubUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    const mode = selectedNode.type === "folder" ? "tree" : "blob";
    return `${cleanUrl}/${mode}/main/${selectedNode.path}`;
  }, [githubUrl, selectedNode]);

  const NodeIcon = selectedNode?.type === "folder" ? FolderOpen : getFileIcon(selectedNode?.name);

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      {/* ─── Compact Controls Bar ─── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/40 bg-card/50 backdrop-blur-md flex-shrink-0 flex-wrap justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="h-3 w-3 absolute left-2.5 top-[7px] text-muted-foreground/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files or folders in diagram..."
            className="w-full pl-7 pr-7 py-1 text-[11px] bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border/40 focus:border-ring/60 rounded-md transition-all text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-[6px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Center / Right Controls Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Group */}
          <div className="flex items-center border border-border/40 rounded-md p-px bg-background/40">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.max(0.15, z - 0.1))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[10px] font-mono px-1.5 text-muted-foreground min-w-[34px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <div className="w-px h-3 bg-border/40" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={resetView}
              title="Reset View"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          {/* Orientation Toggle (TD vs LR) */}
          <div className="flex items-center p-px rounded-md border border-border/40 bg-background/40">
            <button
              onClick={() => setOrientation("TD")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
                orientation === "TD" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Top-to-Bottom"
            >
              <ArrowDownUp className="h-2.5 w-2.5" />
              <span className="hidden xl:inline">Vertical</span>
            </button>
            <button
              onClick={() => setOrientation("LR")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
                orientation === "LR" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Left-to-Right"
            >
              <ArrowLeftRight className="h-2.5 w-2.5" />
              <span className="hidden xl:inline">Horizontal</span>
            </button>
          </div>

          {/* Folders only vs Include files */}
          <div className="flex items-center p-px rounded-md border border-border/40 bg-background/40">
            <button
              onClick={() => setIncludeFiles(false)}
              className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
                !includeFiles ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Folders only"
            >
              <Folder className="h-2.5 w-2.5" />
              <span>Folders</span>
            </button>
            <button
              onClick={() => setIncludeFiles(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-medium transition-all ${
                includeFiles ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Include individual files"
            >
              <File className="h-2.5 w-2.5" />
              <span>+ Files</span>
            </button>
          </div>

          {/* Depth selector */}
          <div className="hidden sm:flex items-center p-px rounded-md border border-border/40 bg-background/40">
            {[1, 2, 3, 4].map((depth) => (
              <button
                key={depth}
                onClick={() => setMaxDepth(depth)}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono transition-all ${
                  maxDepth === depth ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Show up to ${depth} level${depth > 1 ? "s" : ""}`}
              >
                D{depth}
              </button>
            ))}
          </div>

          {/* Vendor / Noise Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-[10px] transition-all ${
              hideNoise ? "text-muted-foreground" : "bg-muted text-foreground font-semibold"
            }`}
            onClick={() => setHideNoise((v) => !v)}
            title="Toggle vendor/build directories like node_modules or dist"
          >
            {hideNoise ? <EyeOff className="h-3 w-3 mr-1 opacity-70" /> : <Eye className="h-3 w-3 mr-1 text-amber-400" />}
            <span className="hidden lg:inline">{hideNoise ? "Noise Hidden" : "Showing Noise"}</span>
          </Button>

          <div className="h-4 w-px bg-border/40 mx-0.5 flex-shrink-0" />

          {/* Export Buttons */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={handleDownloadSVG}
              title="Download vector SVG"
            >
              <Download className="h-3 w-3 mr-1" />
              SVG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={handleDownloadPNG}
              title="Download high-resolution PNG"
            >
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Breadcrumb Navigation & Stats Strip ─── */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/30 bg-muted/10 text-[10px] flex-shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none font-mono">
          <Folder className="h-3 w-3 text-amber-400 flex-shrink-0 mr-0.5" />
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
              {idx > 0 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />}
              <button
                onClick={() => {
                  setFocusNodeId(crumb.id);
                  setSelectedNode(crumb);
                  setPan({ x: 0, y: 0 });
                  setZoom(0.85);
                }}
                className={`px-1 py-0.5 rounded transition-colors ${
                  crumb.id === focusNode?.id
                    ? "font-bold text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Drill to ${crumb.name}`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Quick hint & stats */}
        <div className="flex items-center gap-2 text-muted-foreground font-mono flex-shrink-0 pl-2">
          <span className="hidden md:inline text-[9px] text-muted-foreground/60">
            Click to inspect · Double-click to drill
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{stats.folders}</strong> folders
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{stats.files}</strong> files
          </span>
        </div>
      </div>

      {/* ─── Interactive Mermaid Canvas ─── */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-0 overflow-hidden bg-slate-50/40 dark:bg-background/30"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedNode(null)}
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-[11px] text-muted-foreground font-mono">Rendering diagram...</span>
            </div>
          </div>
        )}

        {renderError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6 max-w-sm space-y-2">
              <p className="text-foreground text-xs font-semibold">Diagram rendering error</p>
              <p className="text-[11px] text-muted-foreground font-mono">{renderError}</p>
              <Button variant="outline" size="sm" onClick={() => setFocusNodeId(fileTree?.id)} className="text-xs">
                Reset to root
              </Button>
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.05s ease-out",
              userSelect: "none",
              willChange: "transform",
            }}
          >
            <div ref={mermaidRef} className="mermaid-wrapper select-none" style={{ minWidth: "400px" }} />
          </div>
        )}

        {/* ─── Selected Node Inspector Drawer ─── */}
        {selectedNode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 w-72 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-3 space-y-3 z-20 animate-in fade-in slide-in-from-right-3 duration-150"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 border border-border/50 flex-shrink-0">
                  <NodeIcon className={`h-3.5 w-3.5 ${selectedNode.type === "folder" ? "text-amber-400" : "text-sky-400"}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate tracking-tight">
                    {selectedNode.name}
                  </h4>
                  <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 uppercase">
                    {selectedNode.type === "folder" ? "Directory" : selectedNode.name.split(".").pop() || "File"}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Path Box */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground uppercase">Path</span>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/40 text-[10px] font-mono text-foreground">
                <span className="truncate mr-1.5" title={selectedNode.path || selectedNode.name}>
                  {selectedNode.path || selectedNode.name}
                </span>
                <button
                  onClick={copyPath}
                  className="text-muted-foreground hover:text-foreground p-0.5 transition-colors flex-shrink-0"
                  title="Copy path"
                >
                  {copiedPath ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Folder children stats */}
            {selectedNode.type === "folder" && (
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/30 text-[10px] font-mono">
                <span className="text-muted-foreground">Contents</span>
                <span className="text-foreground font-semibold">
                  {selectedNode.children?.length || 0} direct item{selectedNode.children?.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
              {selectedNode.type === "folder" && selectedNode.id !== focusNode?.id && (
                <Button
                  size="sm"
                  className="flex-1 h-7 text-[10px] font-semibold"
                  onClick={() => drillInto(selectedNode.id)}
                >
                  <CornerDownRight className="h-3 w-3 mr-1" />
                  Drill In
                </Button>
              )}

              {githubLink && (
                <a
                  href={githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 px-2.5 h-7 rounded-md border border-border/60 hover:bg-muted text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all flex-1"
                >
                  <span>GitHub</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Bottom indicator */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground/40 bg-background/50 border border-border/30 rounded px-1.5 py-0.5 select-none pointer-events-none">
          {Math.round(zoom * 100)}% · {orientation === "TD" ? "TD" : "LR"} · D{maxDepth}
        </div>
      </div>
    </div>
  );
}

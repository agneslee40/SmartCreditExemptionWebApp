import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Vite-friendly worker setup:
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl }) {
  const wrapRef = useRef(null);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // ✅ Zoom controls
  const [zoom, setZoom] = useState(1.0); // 1.0 = 100%

  // ✅ Fit-to-container width
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!wrapRef.current) return;

    const el = wrapRef.current;

    const update = () => {
      const w = el.clientWidth || 800;
      setContainerWidth(w);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const zoomPct = useMemo(() => Math.round(zoom * 100), [zoom]);

  // Page width: fit inside panel, then apply zoom
  const pageWidth = useMemo(() => {
    // subtract some padding so it doesn't touch edges
    const base = Math.max(320, containerWidth - 32);
    return Math.round(base * zoom);
  }, [containerWidth, zoom]);

  if (!fileUrl) {
    return <div style={{ padding: 24, color: "#666" }}>No document selected.</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          Prev
        </button>

        <div>
          Page <b>{pageNumber}</b> / <b>{numPages ?? "?"}</b>
        </div>

        <button
          onClick={() => setPageNumber((p) => Math.min(numPages ?? p + 1, p + 1))}
          disabled={numPages ? pageNumber >= numPages : false}
        >
          Next
        </button>

        <div style={{ width: 1, height: 22, background: "#ddd", marginLeft: 6, marginRight: 6 }} />

        <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}>−</button>
        <div style={{ minWidth: 52, textAlign: "center", fontWeight: 700 }}>{zoomPct}%</div>
        <button onClick={() => setZoom((z) => Math.min(2.0, +(z + 0.1).toFixed(2)))}>+</button>
      </div>

      {/* PDF */}
      <div ref={wrapRef} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "0 16px 24px" }}>
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setPageNumber(1);
              // optional: reset zoom when changing doc
              setZoom(1.0);
            }}
            loading={<div style={{ padding: 24 }}>Loading PDF…</div>}
            error={<div style={{ padding: 24, color: "crimson" }}>Failed to load PDF.</div>}
          >
            <Page pageNumber={pageNumber} width={pageWidth} />
          </Document>
        </div>
      </div>
    </div>
  );
}

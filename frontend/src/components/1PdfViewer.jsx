import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Vite-friendly worker setup:
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  if (!fileUrl) {
    return (
      <div style={{ padding: 24, color: "#666" }}>
        No document selected.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
      {/* Simple controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}>
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
      </div>

      {/* PDF */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 24 }}>
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
          loading={<div style={{ padding: 24 }}>Loading PDF…</div>}
          error={<div style={{ padding: 24, color: "crimson" }}>Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} scale={1.2} />
        </Document>
      </div>
    </div>
  );
}

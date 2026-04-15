import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfCanvasViewerProps {
  blob: Blob;
  fileName: string;
}

const PDF_RENDER_SCALE = 1.6;

export function PdfCanvasViewer({ blob, fileName }: PdfCanvasViewerProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const generatedUrls: string[] = [];

    const renderPdf = async () => {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const data = new Uint8Array(await blob.arrayBuffer());
        const pdf = await getDocument({ data }).promise;
        const renderedPages: string[] = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("canvas-context-unavailable");
          }

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({ canvas, canvasContext: context, viewport }).promise;

          const pageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
              if (result) {
                resolve(result);
                return;
              }

              reject(new Error("page-blob-generation-failed"));
            }, "image/png");
          });

          const pageUrl = URL.createObjectURL(pageBlob);
          generatedUrls.push(pageUrl);
          renderedPages.push(pageUrl);
        }

        if (!renderedPages.length) {
          throw new Error("empty-pdf");
        }

        if (!cancelled) {
          setPages(renderedPages);
        }
      } catch (renderError) {
        console.error("Failed to render invoice PDF", renderError);
        if (!cancelled) {
          setError("Não foi possível desenhar o PDF dentro da app.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      generatedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [blob]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A desenhar o PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-foreground">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 bg-muted/20 min-h-full">
      {pages.map((pageUrl, index) => (
        <div
          key={pageUrl}
          className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border bg-card shadow-sm"
        >
          <img
            src={pageUrl}
            alt={`${fileName} - página ${index + 1}`}
            className="block h-auto w-full"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
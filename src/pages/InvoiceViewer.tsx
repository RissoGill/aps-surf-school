import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "expense-invoices";

function extractStoragePath(url: string): string | null {
  try {
    const marker = `/object/public/${BUCKET_NAME}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const pathWithQuery = url.substring(idx + marker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0]);
  } catch {
    return null;
  }
}

const InvoiceViewer = () => {
  const [searchParams] = useSearchParams();
  const src = searchParams.get("src") || "";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const fileName = (() => {
    try {
      const pathname = new URL(src).pathname;
      return pathname.split("/").pop() || "fatura";
    } catch {
      return "fatura";
    }
  })();

  useEffect(() => {
    if (!src) { setLoading(false); return; }

    let cancelled = false;

    const loadViaStorage = async (path: string): Promise<boolean> => {
      try {
        const { data, error: dlError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(path);
        if (dlError || !data) return false;
        if (cancelled) return true;
        const ct = data.type || "";
        const url = URL.createObjectURL(data);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setContentType(ct);
        return true;
      } catch {
        return false;
      }
    };

    const loadViaFetch = async (): Promise<boolean> => {
      try {
        const res = await fetch(src);
        if (!res.ok) return false;
        const blob = await res.blob();
        if (cancelled) return true;
        const ct = blob.type || res.headers.get("content-type") || "";
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setContentType(ct);
        return true;
      } catch {
        return false;
      }
    };

    const load = async () => {
      const storagePath = extractStoragePath(src);
      let ok = false;

      if (storagePath) {
        ok = await loadViaStorage(storagePath);
      }

      if (!ok && !cancelled) {
        ok = await loadViaFetch();
      }

      if (!cancelled) {
        if (!ok) setError(true);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [src]);

  const isPdf = contentType.includes("pdf");
  const isImage = contentType.startsWith("image/");

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(src, "_blank");
    }
  };

  if (!src) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <p>Nenhum ficheiro para apresentar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A carregar fatura…</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Não foi possível carregar a fatura.</p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir Original
            </a>
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <FileText className="h-4 w-4" />
          <span>Fatura</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={src} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir Original
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {isPdf ? (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title="Invoice PDF"
          />
        ) : isImage ? (
          <div className="flex items-center justify-center h-full p-4 bg-muted/30">
            <img
              src={blobUrl}
              alt="Invoice"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">
              Pré-visualização não disponível para este tipo de ficheiro.
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewer;

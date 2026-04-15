import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PdfCanvasViewer } from "@/components/invoice";

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

function getFileName(src: string) {
  try {
    const pathname = new URL(src).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "fatura");
  } catch {
    return "fatura";
  }
}

function inferContentType(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";

  return "application/octet-stream";
}

function getDownloadName(fileName: string, contentType: string) {
  if (fileName.includes(".")) {
    return fileName;
  }

  if (contentType.includes("pdf")) return `${fileName}.pdf`;
  if (contentType === "image/png") return `${fileName}.png`;
  if (contentType === "image/jpeg") return `${fileName}.jpg`;
  if (contentType === "image/webp") return `${fileName}.webp`;
  if (contentType === "image/gif") return `${fileName}.gif`;

  return fileName;
}

const InvoiceViewer = () => {
  const [searchParams] = useSearchParams();
  const src = searchParams.get("src") || "";
  const requestedDownload = searchParams.get("download") === "1";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const autoDownloadTriggeredRef = useRef(false);
  const fileName = useMemo(() => getFileName(src), [src]);

  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setBlobUrl(null);
    setFileBlob(null);
    setContentType("");
    setErrorMessage(null);
    setLoading(true);
    autoDownloadTriggeredRef.current = false;

    if (!src) {
      setErrorMessage("Nenhum ficheiro para apresentar.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const applyBlob = (blob: Blob, fallbackType: string) => {
      if (!blob.size) {
        throw new Error("empty-file");
      }

      const normalizedType = blob.type || fallbackType || inferContentType(fileName);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobUrl(url);
      setFileBlob(blob);
      setContentType(normalizedType);
      setErrorMessage(null);
    };

    const loadViaStorage = async (path: string): Promise<boolean> => {
      try {
        const { data, error: dlError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(path);
        if (dlError || !data) return false;
        if (cancelled) return true;
        applyBlob(data, inferContentType(fileName));
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
        applyBlob(blob, res.headers.get("content-type") || inferContentType(fileName));
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
        if (!ok) {
          setErrorMessage("Não foi possível obter a fatura a partir do storage.");
        }
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [src]);

  const openFile = useCallback(() => {
    if (blobUrl) {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (src) {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }, [blobUrl, src]);

  const handleDownload = useCallback(async () => {
    if (!fileBlob) {
      openFile();
      return;
    }

    const normalizedType = contentType || fileBlob.type || inferContentType(fileName);
    const resolvedFileName = getDownloadName(fileName, normalizedType);

    // 1. Try direct <a download> first (works on desktop & Android)
    try {
      const downloadUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = resolvedFileName;
      anchor.rel = "noopener noreferrer";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      // Give the browser a moment to start the download before revoking
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 3000);

      // On iOS Safari, <a download> is ignored — detect and fall through
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (!isIOS) return;
    } catch {
      // Fall through to next strategy
    }

    // 2. Try Web Share API (best for iOS)
    try {
      const downloadableFile = new File([fileBlob], resolvedFileName, { type: normalizedType });
      const shareNav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (shareNav.canShare?.({ files: [downloadableFile] }) && shareNav.share) {
        await shareNav.share({ files: [downloadableFile], title: resolvedFileName });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Fall through to final fallback
    }

    // 3. Final fallback — open blob in new tab so user can save manually
    const fallbackUrl = blobUrl || URL.createObjectURL(fileBlob);
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  }, [blobUrl, contentType, fileBlob, fileName, openFile]);

  useEffect(() => {
    if (!requestedDownload || !fileBlob || autoDownloadTriggeredRef.current) {
      return;
    }

    autoDownloadTriggeredRef.current = true;
    void handleDownload();
  }, [fileBlob, handleDownload, requestedDownload]);

  const isPdf = contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
  const isImage = contentType.startsWith("image/");
  const isPreviewUnsupported = !loading && !errorMessage && !isPdf && !isImage;

  if (!src && errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <p>{errorMessage}</p>
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

  if (errorMessage || !fileBlob || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{errorMessage || "Não foi possível carregar a fatura."}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openFile}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir ficheiro
          </Button>
          {src ? (
            <Button variant="outline" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir original
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex min-w-0 items-center gap-2 text-sm text-foreground">
          <FileText className="h-4 w-4" />
          <span className="truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={openFile}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir ficheiro
          </Button>
          {src ? (
            <Button variant="outline" size="sm" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir original
              </a>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {isPdf ? (
          <PdfCanvasViewer blob={fileBlob} fileName={fileName} />
        ) : isImage ? (
          <div className="flex items-center justify-center h-full p-4 bg-muted/30">
            <img
              src={blobUrl}
              alt="Invoice"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : isPreviewUnsupported ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">
              Este tipo de ficheiro não tem pré-visualização inline, mas pode ser aberto ou descarregado.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" onClick={openFile}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir ficheiro
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">
              A preparar a fatura…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewer;

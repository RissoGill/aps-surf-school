import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfCanvasViewer } from "@/components/invoice";
import {
  getInvoiceDownloadName,
  getInvoiceFileName,
  inferInvoiceContentType,
  loadInvoiceFile,
  revokeInvoiceBlobUrl,
  shareInvoiceFile,
} from "@/utils/invoiceFile";

const InvoiceViewer = () => {
  const [searchParams] = useSearchParams();
  const src = searchParams.get("src") || "";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const fileName = useMemo(() => getInvoiceFileName(src), [src]);
  const resolvedDownloadName = useMemo(
    () => getInvoiceDownloadName(fileName, contentType || fileBlob?.type || inferInvoiceContentType(fileName)),
    [contentType, fileBlob, fileName],
  );

  useEffect(() => {
    if (blobUrlRef.current) {
      revokeInvoiceBlobUrl(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setBlobUrl(null);
    setFileBlob(null);
    setContentType("");
    setErrorMessage(null);
    setLoading(true);

    if (!src) {
      setErrorMessage("Nenhum ficheiro para apresentar.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const file = await loadInvoiceFile(src);

        if (cancelled) {
          revokeInvoiceBlobUrl(file.blobUrl);
          return;
        }

        blobUrlRef.current = file.blobUrl;
        setBlobUrl(file.blobUrl);
        setFileBlob(file.blob);
        setContentType(file.contentType);
        setErrorMessage(null);
      } catch {
        if (!cancelled) {
          setErrorMessage("Não foi possível obter a fatura a partir do storage.");
        }
      } finally {
        if (!cancelled) {
        setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) revokeInvoiceBlobUrl(blobUrlRef.current);
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

  const handleManualSave = useCallback(async () => {
    if (!fileBlob) {
      openFile();
      return;
    }

    const normalizedType = contentType || fileBlob.type || inferInvoiceContentType(fileName);
    const shared = await shareInvoiceFile(fileBlob, resolvedDownloadName, normalizedType);

    if (shared) {
      return;
    }

    openFile();
  }, [contentType, fileBlob, fileName, openFile, resolvedDownloadName]);

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
          <Button size="sm" asChild>
            <a href={blobUrl} download={resolvedDownloadName}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleManualSave}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Guardar manualmente
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
              <Button asChild>
                <a href={blobUrl} download={resolvedDownloadName}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
              <Button variant="outline" onClick={handleManualSave}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Guardar manualmente
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

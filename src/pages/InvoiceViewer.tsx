import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";

const InvoiceViewer = () => {
  const [searchParams] = useSearchParams();
  const src = searchParams.get("src") || "";

  const isPdf = (() => {
    try {
      const pathname = new URL(src).pathname.toLowerCase();
      return pathname.endsWith(".pdf");
    } catch {
      return src.toLowerCase().includes(".pdf");
    }
  })();

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!src) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <p>No file to display.</p>
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
          <object
            data={src}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">
                Não foi possível pré-visualizar o PDF.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" asChild>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir Original
                  </a>
                </Button>
              </div>
            </div>
          </object>
        ) : (
          <div className="flex items-center justify-center h-full p-4 bg-muted/30">
            <img
              src={src}
              alt="Invoice"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewer;

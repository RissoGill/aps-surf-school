import { supabase } from "@/integrations/supabase/client";

export const INVOICE_BUCKET_NAME = "expense-invoices";

type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

export interface LoadedInvoiceFile {
  blob: Blob;
  blobUrl: string;
  contentType: string;
  fileName: string;
  downloadName: string;
}

export function extractInvoiceStoragePath(url: string): string | null {
  try {
    const marker = `/object/public/${INVOICE_BUCKET_NAME}/`;
    const index = url.indexOf(marker);

    if (index === -1) return null;

    const pathWithQuery = url.substring(index + marker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0]);
  } catch {
    return null;
  }
}

export function getInvoiceFileName(src: string) {
  try {
    const pathname = new URL(src).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "fatura");
  } catch {
    return "fatura";
  }
}

export function inferInvoiceContentType(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";

  return "application/octet-stream";
}

export function getInvoiceDownloadName(fileName: string, contentType: string) {
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

export function revokeInvoiceBlobUrl(blobUrl?: string | null) {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
}

export function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function triggerInvoiceDownload(blobUrl: string, downloadName: string) {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = downloadName;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function shareInvoiceFile(blob: Blob, downloadName: string, contentType: string) {
  try {
    const downloadableFile = new File([blob], downloadName, { type: contentType });
    const shareNavigator = navigator as ShareNavigator;

    if (shareNavigator.canShare?.({ files: [downloadableFile] }) && shareNavigator.share) {
      await shareNavigator.share({ files: [downloadableFile], title: downloadName });
      return true;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
  }

  return false;
}

async function loadInvoiceFromStorage(src: string) {
  const storagePath = extractInvoiceStoragePath(src);

  if (!storagePath) {
    return null;
  }

  const { data, error } = await supabase.storage.from(INVOICE_BUCKET_NAME).download(storagePath);

  if (error || !data || !data.size) {
    return null;
  }

  return data;
}

async function loadInvoiceFromFetch(src: string) {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error("invoice-fetch-failed");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("invoice-empty-file");
  }

  return {
    blob,
    contentType: response.headers.get("content-type") || "",
  };
}

export async function loadInvoiceFile(src: string): Promise<LoadedInvoiceFile> {
  if (!src) {
    throw new Error("invoice-missing-src");
  }

  const fileName = getInvoiceFileName(src);
  const storageBlob = await loadInvoiceFromStorage(src);

  const file = storageBlob
    ? {
        blob: storageBlob,
        contentType: storageBlob.type || inferInvoiceContentType(fileName),
      }
    : await loadInvoiceFromFetch(src);

  const contentType = file.contentType || file.blob.type || inferInvoiceContentType(fileName);

  return {
    blob: file.blob,
    blobUrl: URL.createObjectURL(file.blob),
    contentType,
    fileName,
    downloadName: getInvoiceDownloadName(fileName, contentType),
  };
}
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, ExternalLink, Loader2 } from 'lucide-react';
import { materialService } from '../services';
import { apiErrorMessage } from '../api/client';

interface PdfViewerProps {
  materialId: string;
  fileName?: string;
  /** Page to open on (1-based). Browsers' built-in PDF viewers honour #page=. */
  page?: number;
}

/**
 * Displays the uploaded PDF. The file endpoint needs the JWT, which an
 * <iframe src> can't send, so we fetch the bytes through axios and show them
 * from a same-origin blob: URL (this also avoids cross-origin framing blocks).
 *
 * Self-contained: it has its own loading and error messages, so it does not
 * depend on any other component file.
 */
export function PdfViewer({ materialId, fileName = 'document.pdf', page = 1 }: PdfViewerProps) {
  const { data: blob, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['material-file', materialId],
    queryFn: () => materialService.file(materialId),
    staleTime: Infinity,
    retry: 1,
  });

  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => {
    // Free the blob URL when the PDF changes or the viewer unmounts.
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-terracotta-500">
        <Loader2 size={18} className="animate-spin" /> Loading PDF…
      </div>
    );
  }

  if (isError || !url) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-6 text-center dark:bg-red-950">
        <AlertTriangle className="text-red-500" size={22} />
        <p className="text-sm text-red-600 dark:text-red-400">
          Could not load the PDF: {apiErrorMessage(error)}
        </p>
        <button onClick={() => refetch()} className="btn-primary">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        src={`${url}#page=${page}`}
        title="PDF viewer"
        className="h-[75vh] w-full rounded-xl border border-terracotta-200 dark:border-terracotta-700"
      />
      <div className="flex gap-4 text-sm">
        {/* Fallback for browsers (e.g. mobile Safari) that don't render PDFs inside an iframe */}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-terracotta-500 hover:text-terracotta-600"
        >
          <ExternalLink size={14} /> Open in new tab
        </a>
        <a
          href={url}
          download={fileName}
          className="inline-flex items-center gap-1 text-terracotta-500 hover:text-terracotta-600"
        >
          <Download size={14} /> Download PDF
        </a>
      </div>
    </div>
  );
}
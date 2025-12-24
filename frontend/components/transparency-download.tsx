'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface TransparencyDownloadProps {
  bolaoId: string;
  hasFile: boolean;
}

export function TransparencyDownload({ bolaoId, hasFile }: TransparencyDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);
    try {
      const response = await api.get(`/boloes/${bolaoId}/transparency`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const suggestedName = contentDisposition?.split('filename=')[1]?.replace(/"/g, '');
      link.href = url;
      link.download = suggestedName || `transparencia-bolao-${bolaoId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (downloadError: any) {
      const message =
        downloadError?.response?.data?.message ?? 'Não foi possível baixar o arquivo de transparência.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-2 text-right">
      <button
        type="button"
        onClick={handleDownload}
        disabled={!hasFile || isDownloading}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDownloading ? 'Gerando...' : 'Baixar transparência'}
      </button>
      {error && <p className="text-xs text-megga-rose">{error}</p>}
      {!hasFile && !error && <p className="text-xs text-white/40">Arquivo disponível após as primeiras apostas.</p>}
    </div>
  );
}

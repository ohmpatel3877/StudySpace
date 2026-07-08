import React, { useState, useEffect } from 'react';
import { safeInvoke } from '../context/AppContext';

interface PdfViewerProps {
  path: string;
  onError: (msg: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ path, onError }) => {
  const [pdfData, setPdfData] = useState<string>('');

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const data = await safeInvoke('read_vault_file', { path });
        if (!data) {
          throw new Error('Empty PDF document');
        }
        setPdfData(data);
      } catch (err) {
        console.error('PDF load failed', err);
        onError('Corrupted PDF or empty document');
      }
    };
    loadPdf();
  }, [path, onError]);

  if (!pdfData) return null;

  return (
    <iframe
      data-testid="pdf-iframe"
      src={pdfData}
      className="w-full h-full border-none bg-slate-900"
      title="PDF Viewer"
    />
  );
};

export default PdfViewer;
export { PdfViewer };

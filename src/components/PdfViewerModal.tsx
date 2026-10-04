import React from 'react';
import { AttachedPdfDoc } from '../types';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: AttachedPdfDoc | null;
  title?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  title,
}) => {
  if (!isOpen || !pdfDoc) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfDoc.dataUrl;
      link.download = pdfDoc.name || 'Ritning_och_Instruktion.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Kunde inte ladda ner PDF:', err);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${pdfDoc.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    } catch {}
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#141414] border border-[#2b2b2b] rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white truncate">
                {title || pdfDoc.name}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {pdfDoc.name} · {pdfDoc.sizeFormatted || 'PDF-dokument'}
                {pdfDoc.uploadedAt && ` · Uppladdad ${pdfDoc.uploadedAt}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="hidden sm:flex px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-slate-300 hover:text-white rounded-xl text-xs font-bold items-center gap-1.5 cursor-pointer transition-colors"
              title="Öppna i ny flik"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ny flik</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-orange-500/20"
              title="Ladda ner PDF till enheten"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ladda ner</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#242424] hover:bg-[#333] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-[#0d0d0d] p-2 sm:p-4 flex flex-col items-center justify-center overflow-hidden">
          <iframe
            src={pdfDoc.dataUrl}
            title={pdfDoc.name}
            className="w-full h-full rounded-2xl border border-[#262626] bg-[#1a1a1a]"
          />
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-[#171717] border-t border-[#262626] flex items-center justify-between text-xs text-slate-400 px-5 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              Originalritning & instruktioner tillgängliga direkt i fält för elev och lärare.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-orange-400 hover:underline font-bold cursor-pointer"
          >
            Stäng visare
          </button>
        </div>
      </div>
    </div>
  );
};

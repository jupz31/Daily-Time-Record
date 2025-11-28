import React from 'react';
import jsPDF from 'jspdf';
import { X, Download } from './icons';

interface PdfPreviewModalProps {
  doc: jsPDF;
  filename: string;
  onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ doc, filename, onClose }) => {
  const dataUri = doc.output('datauristring');

  const handleDownload = () => {
    doc.save(filename);
    onClose(); // Close after download
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[70] p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">PDF Preview</h3>
          <div className="flex items-center gap-4">
             <button
              onClick={handleDownload}
              className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5 text-gray-500"/>
            </button>
          </div>
        </div>
        <div className="flex-grow bg-gray-200 dark:bg-gray-900">
          <iframe
            src={dataUri}
            title="PDF Preview"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;

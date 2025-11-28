import React from 'react';
import { X, Download } from './icons';

interface QrCodeDisplayModalProps {
  dataUrl: string;
  employeeName: string;
  employeeId: string;
  department: string;
  onClose: () => void;
}

const QrCodeDisplayModal: React.FC<QrCodeDisplayModalProps> = ({ dataUrl, employeeName, employeeId, department, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qrcode-${department}-${employeeId}-${employeeName.replace(/\s/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm text-center p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">QR Code Generated</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-500"/>
            </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The QR code for <span className="font-bold">{employeeName}</span> has been successfully created. Download it for their use.
        </p>
        <div className="flex justify-center my-6">
            <img src={dataUrl} alt={`QR Code for ${employeeName}`} className="border-4 border-white dark:border-gray-600 shadow-lg rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
             <button
                onClick={onClose}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium"
            >
                Close
            </button>
            <button
                onClick={handleDownload}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
                <Download className="h-5 w-5" />
                Download
            </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeDisplayModal;
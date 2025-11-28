import React, { useState } from 'react';
import { EmployeeInfo } from '../types';
import QrScanner from './QrScanner';
import { X, QrCode } from './icons';

interface QrLoginModalProps {
  onClose: () => void;
  onQrLogin: (decodedData: EmployeeInfo) => boolean;
}

const QrLoginModal: React.FC<QrLoginModalProps> = ({ onClose, onQrLogin }) => {
    const [scanStatus, setScanStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const handleScanSuccess = (decodedData: EmployeeInfo) => {
        if (!decodedData.username) {
            setScanStatus({ message: 'This QR code is not enabled for login.', type: 'error' });
            return;
        }

        const success = onQrLogin(decodedData);
        if (success) {
            setScanStatus({ message: `Welcome, ${decodedData.name}! Logging in...`, type: 'success' });
            // The modal will close automatically as the App component re-renders on successful login.
        } else {
            setScanStatus({ message: 'Login failed. This QR code is not associated with a valid user.', type: 'error' });
        }
    };

    const handleScanError = (error: string) => {
        setScanStatus({ message: error, type: 'error' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-green-600"/> Login with QR Code
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-5 w-5 text-gray-500"/>
                    </button>
                </div>
                <div className="p-4">
                    <QrScanner 
                        onScanSuccess={(data, source) => handleScanSuccess(data)}
                        onScanError={handleScanError}
                        scanStatus={scanStatus}
                        clearScanStatus={() => setScanStatus(null)}
                    />
                </div>
            </div>
        </div>
    );
};

export default QrLoginModal;
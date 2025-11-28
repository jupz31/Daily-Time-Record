import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EmployeeInfo } from '../types';
import { X, CheckCircle, XCircle, UserCircle } from './icons';

interface FaceVerifierModalProps {
  employee: EmployeeInfo;
  onConfirm: () => void;
  onCancel: () => void;
}

const FaceVerifierModal: React.FC<FaceVerifierModalProps> = ({ employee, onConfirm, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 300, height: 300, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Could not access camera. Please check browser permissions.');
      console.error(err);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 animate-fade-in-down" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Face Verification</h3>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500"/>
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please confirm that the person in the camera feed matches the employee's profile photo.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-center text-sm font-medium">Profile Photo</p>
            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <UserCircle className="w-24 h-24 text-gray-400" />
              )}
            </div>
            <p className="text-center font-bold">{employee.name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-center text-sm font-medium">Live Camera</p>
            <div className="relative w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {error && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                  <p className="text-center text-white text-sm">{error}</p>
                </div>
              )}
            </div>
             <p className="text-center font-bold text-transparent">.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
                onClick={onCancel} 
                className="flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
            >
                <XCircle className="h-5 w-5"/> Reject
            </button>
            <button 
                onClick={onConfirm} 
                className="flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                disabled={!!error}
            >
                <CheckCircle className="h-5 w-5"/> Confirm Match
            </button>
        </div>

      </div>
    </div>
  );
};

export default FaceVerifierModal;

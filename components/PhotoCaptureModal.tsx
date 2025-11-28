import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Check, X, RefreshCw } from './icons';

interface PhotoCaptureModalProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({ onSave, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCapturedImage(null);
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

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleSave = () => {
    if (capturedImage) {
      onSave(capturedImage);
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Capture Photo</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-500"/>
            </button>
        </div>

        <div className="relative w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover"/>
            ) : (
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            )}
             <canvas ref={canvasRef} className="hidden" />
             {error && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                    <p className="text-center text-white text-sm">{error}</p>
                </div>
            )}
        </div>

        {error ? (
             <button onClick={onClose} className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Close</button>
        ) : (
            <div className="grid grid-cols-2 gap-4">
            {capturedImage ? (
                <>
                    <button onClick={handleRetake} className="flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">
                        <RefreshCw className="h-4 w-4"/> Retake
                    </button>
                    <button onClick={handleSave} className="flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4"/> Save Photo
                    </button>
                </>
            ) : (
                <button onClick={takePhoto} className="col-span-2 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                    <Camera className="h-5 w-5"/> Take Photo
                </button>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCaptureModal;
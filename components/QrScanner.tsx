import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { UploadCloud, XCircle, CheckCircle, Camera } from './icons';

interface QrScannerProps {
  onScanSuccess: (decodedData: any, source: 'camera' | 'upload') => void;
  onScanError: (error: string) => void;
  scanStatus: { message: string, type: 'success' | 'error' } | null;
  clearScanStatus: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanError, scanStatus, clearScanStatus }) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const drawHighlight = (location: {
      topLeftCorner: { x: number; y: number };
      topRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
    }) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#4ade80'; // Tailwind green-400
    ctx.stroke();
  };

  const clearHighlight = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const processCode = (codeData: string, source: 'camera' | 'upload') => {
    try {
      const decodedData: any = JSON.parse(codeData);
      onScanSuccess(decodedData, source);
    } catch (error) {
      onScanError('Failed to parse QR code. Not a valid JSON code.');
    }
    // For uploads, we stop processing immediately. 
    // For camera, the useEffect on scanStatus will handle the restart.
    if (source === 'upload') {
        setIsProcessing(false);
    }
  };
  
  const stopScan = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
    }
  };

  const scanLoop = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

            if (code) {
                stopScan();
                drawHighlight(code.location);
                setTimeout(() => {
                    processCode(code.data, 'camera');
                }, 300);
                return; 
            }
        }
    }
    requestRef.current = requestAnimationFrame(scanLoop);
  };

  const startScan = async () => {
    clearScanStatus();
    clearHighlight();
    setCameraError(null);
    setIsProcessing(true);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            requestRef.current = requestAnimationFrame(scanLoop);
        }
    } catch (err) {
        let message = 'Could not access the camera. Please ensure it is not being used by another application.';
        if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = 'Camera permission was denied. Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                message = 'No camera found on this device.';
            }
        }
        setCameraError(message);
        setIsProcessing(false);
    }
  };
  
  // This new useEffect handles restarting the camera after a scan result is shown.
  useEffect(() => {
    if (scanStatus && mode === 'camera') {
        const timer = setTimeout(() => {
            // Only restart if the user is still in camera mode
            if (mode === 'camera') {
                startScan();
            }
        }, 3000); // Display status for 3 seconds

        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanStatus]); // Re-run when a new scan status is received

  useEffect(() => {
    if (mode === 'camera') {
      startScan();
    } else {
      stopScan();
      clearHighlight();
    }
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    clearScanStatus();
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          onScanError('Canvas element not found.');
          setIsProcessing(false);
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            onScanError('Could not get canvas context.');
            setIsProcessing(false);
            return;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          processCode(code.data, 'upload');
        } else {
          onScanError('No QR code found in the image.');
          setIsProcessing(false);
        }
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`w-1/2 flex items-center justify-center gap-2 py-3 text-sm font-medium text-center transition-colors rounded-t-lg
                ${active 
                    ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
        >
            {children}
        </button>
  );

  return (
    <div className="space-y-6">
       <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scan QR Code</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Scan with your camera or upload an image to record time.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <TabButton active={mode === 'camera'} onClick={() => setMode('camera')}><Camera className="h-5 w-5"/> Scan from Camera</TabButton>
        <TabButton active={mode === 'upload'} onClick={() => setMode('upload')}><UploadCloud className="h-5 w-5"/> Upload Image</TabButton>
      </div>
      
      <div className="space-y-4">
        {mode === 'camera' && (
            <div className="relative w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 w-full h-full" />
                {cameraError && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                        <p className="text-center text-white text-sm">{cameraError}</p>
                    </div>
                )}
                {!cameraError && isProcessing && !scanStatus && (
                     <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <p className="text-center text-white text-sm bg-black/50 px-3 py-1 rounded-full">Point camera at a QR code</p>
                    </div>
                )}
            </div>
        )}

        {mode === 'upload' && (
            <>
                <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-green-500 dark:hover:border-green-400 transition-colors"
                    onClick={handleUploadClick}
                >
                    <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <p className="pl-1">
                            {isProcessing ? 'Processing...' : (fileName || 'Click to upload QR code image')}
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG</p>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isProcessing}
                />
            </>
        )}
       
       <canvas ref={canvasRef} className="hidden" />

       {scanStatus && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${scanStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
          {scanStatus.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{scanStatus.message}</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default QrScanner;

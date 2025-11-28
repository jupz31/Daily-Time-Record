import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, ChevronDown, ChevronUp } from './icons';
import { Department } from '../types';

interface QrGeneratorProps {
    departments: Department[];
    isHeadView?: boolean;
}

const QrGenerator: React.FC<QrGeneratorProps> = ({ departments, isHeadView = false }) => {
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0]?.name || '');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Customization state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [darkColor, setDarkColor] = useState('#020617');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-select the first department if available
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0].name);
    }
  }, [departments, selectedDepartment]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setCustomLogo(null);
    if(logoInputRef.current) {
        logoInputRef.current.value = '';
    }
  }

  const generateQrCode = async () => {
    if (!selectedDepartment) {
      setError('A department must be selected.');
      setQrCodeDataUrl('');
      return;
    }
    setError('');
    
    const departmentDetails = departments.find(d => d.name === selectedDepartment);
    if (!departmentDetails) {
        setError('Could not find department details for QR code generation.');
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas element not found.');
      return;
    }

    try {
      const departmentInfoText = JSON.stringify({ 
          department: departmentDetails.name,
      });
      
      await QRCode.toCanvas(canvas, departmentInfoText, {
          errorCorrectionLevel: errorCorrectionLevel,
          margin: 3,
          scale: 8,
          color: {
            dark: darkColor,
            light: lightColor
          }
      });

      const logoToDraw = customLogo || departmentDetails?.photoUrl;
      
      if (logoToDraw) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
              const img = new Image();
              img.crossOrigin = 'Anonymous'; 
              img.src = logoToDraw;
              img.onload = () => {
                  const qrSize = canvas.width;
                  const imgSize = qrSize * 0.3; // Logo will be 30% of the QR code size
                  const x = (qrSize - imgSize) / 2;
                  const y = (qrSize - imgSize) / 2;
                  
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(x - 5, y - 5, imgSize + 10, imgSize + 10);
                  
                  ctx.drawImage(img, x, y, imgSize, imgSize);
                  
                  setQrCodeDataUrl(canvas.toDataURL('image/png'));
              };
              img.onerror = () => {
                  setQrCodeDataUrl(canvas.toDataURL('image/png'));
              };
          } else {
            setQrCodeDataUrl(canvas.toDataURL('image/png'));
          }
      } else {
          setQrCodeDataUrl(canvas.toDataURL('image/png'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code.');
      setQrCodeDataUrl('');
    }
  };
  
  const handleDownload = () => {
      if (!qrCodeDataUrl) return;
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `qrcode-DTR-${selectedDepartment.replace(/\s/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const isFormValid = !!selectedDepartment;
  const inputStyle = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";


  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Department QR Code</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate a scannable QR code for a specific department's DTR.</p>
      </div>
      <div className="space-y-4">
        <div>
            <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Department</label>
            <select id="department-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className={`mt-1 ${inputStyle}`} disabled={isHeadView}>
                {departments.map(dep => (
                    <option key={dep.name} value={dep.name}>{dep.name}</option>
                ))}
            </select>
            {isHeadView && <p className="text-xs text-gray-500 mt-1">Department is locked for this view.</p>}
        </div>
      </div>
      
       <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="flex justify-between items-center w-full text-left font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors">
                <span>Customization Options</span>
                {isAdvancedOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {isAdvancedOpen && (
                <div className="mt-4 space-y-4 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="darkColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">QR Color</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" id="darkColor" value={darkColor} onChange={e => setDarkColor(e.target.value)} className="p-0 h-10 w-10 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-md" />
                                <input type="text" value={darkColor} onChange={e => setDarkColor(e.target.value)} className={inputStyle} />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="lightColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Background Color</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" id="lightColor" value={lightColor} onChange={e => setLightColor(e.target.value)} className="p-0 h-10 w-10 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-md" />
                                <input type="text" value={lightColor} onChange={e => setLightColor(e.target.value)} className={inputStyle} />
                            </div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Logo</label>
                        <div className="mt-1 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                {customLogo ? <img src={customLogo} alt="Logo Preview" className="w-full h-full object-contain rounded-md p-1" /> : <span className="text-xs text-gray-400">None</span>}
                            </div>
                            <div>
                                <input type="file" id="logo-upload" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} />
                                <label htmlFor="logo-upload" className="cursor-pointer py-1.5 px-3 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Upload Image</label>
                                {customLogo && <button type="button" onClick={removeLogo} className="text-sm text-red-500 hover:underline ml-2">Remove</button>}
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">If no custom logo is uploaded, the department's photo (if available) will be used.</p>
                    </div>
                    <div>
                        <label htmlFor="error-correction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Error Correction Level</label>
                        <select id="error-correction" value={errorCorrectionLevel} onChange={e => setErrorCorrectionLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')} className={`mt-1 ${inputStyle}`}>
                            <option value="L">Low (~7% correction)</option>
                            <option value="M">Medium (~15% correction)</option>
                            <option value="Q">Quartile (~25% correction)</option>
                            <option value="H">High (~30% correction)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Using a logo requires a higher level (Q or H) to ensure the QR code remains scannable.</p>
                    </div>
                </div>
            )}
       </div>

       {error && <p className="text-sm text-red-500">{error}</p>}
      <button onClick={generateQrCode} disabled={!isFormValid} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
        <QrCode className="h-5 w-5" />
        Generate QR Code
      </button>

      {qrCodeDataUrl && (
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Generated QR Code for {selectedDepartment}</h4>
            <div className="flex justify-center p-2 rounded-lg" style={{ backgroundColor: lightColor }}>
                 <img src={qrCodeDataUrl} alt="Generated QR Code" className="shadow-lg rounded-lg" style={{ border: `4px solid ${darkColor}`}} />
            </div>
            <button onClick={handleDownload} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                <Download className="h-5 w-5" />
                Download
            </button>
        </div>
      )}
    </div>
  );
};

export default QrGenerator;
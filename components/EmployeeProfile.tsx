import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { EmployeeInfo, DailyTimeRecord, LeaveRecord, User, LeaveStatus, EmployeeRole } from '../types';
import { X, UserCircle, Clock, CalendarOff, Edit, FileDown, QrCode, Download } from './icons';
import TimesheetEditModal from './TimesheetEditModal';
import PdfPreviewModal from './PdfPreviewModal';

interface EmployeeProfileProps {
    user: User;
    employee: EmployeeInfo;
    dailyRecords: DailyTimeRecord[];
    leaveRecords: LeaveRecord[];
    onClose: () => void;
    onUpdateTimeLogs?: (records: DailyTimeRecord[]) => void;
}

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const statusMap = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ${statusMap[status]}`}>{status}</span>;
};

const RoleBadge: React.FC<{ role: EmployeeRole }> = ({ role }) => {
    const roleStyles: Record<EmployeeRole, string> = {
        'Admin': 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300',
        'Manager': 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'User': 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleStyles[role]}`}>
            {role}
        </span>
    );
};

const calculateMinutes = (record: DailyTimeRecord): number => {
    const { timeIn, timeOut, breakIn, breakOut } = record;
    if (!timeIn || !timeOut) return 0;
    const timeInMs = new Date(timeIn).getTime();
    const timeOutMs = new Date(timeOut).getTime();
    let breakDurationMs = 0;
    if (breakIn && breakOut) {
        const breakInMs = new Date(breakIn).getTime();
        const breakOutMs = new Date(breakOut).getTime();
        if (breakInMs > breakOutMs) breakDurationMs = breakInMs - breakOutMs;
    }
    const totalWorkMs = timeOutMs - timeInMs - breakDurationMs;
    if (totalWorkMs < 0) return 0;
    return Math.floor(totalWorkMs / 60000);
};

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user, employee, dailyRecords, leaveRecords, onClose, onUpdateTimeLogs }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [isEditingTimesheet, setIsEditingTimesheet] = useState(false);
    const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
    const [pdfFilename, setPdfFilename] = useState('');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const generateQr = async () => {
            if (!employee) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
    
            try {
                const employeeInfoText = JSON.stringify({ 
                    id: employee.id, 
                    name: employee.name,
                    department: employee.department,
                });
                
                await QRCode.toCanvas(canvas, employeeInfoText, {
                    errorCorrectionLevel: 'H',
                    margin: 3,
                    scale: 8,
                    color: { dark: "#020617", light: "#FFFFFF" }
                });
    
                if (employee.photoUrl) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.src = employee.photoUrl;
                        
                        img.onload = () => {
                            const qrSize = canvas.width;
                            const imgSize = qrSize * 0.3;
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
                console.error('Failed to generate QR code:', err);
            }
        };
        generateQr();
    }, [employee]);

     const handleDownloadQr = () => {
      if (!qrCodeDataUrl) return;
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `qrcode-${employee.department}-${employee.id}-${employee.name.replace(/\s/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const employeeRecords = useMemo(() => dailyRecords.filter(r => r.employeeId === employee.id).sort((a,b) => b.date.localeCompare(a.date)), [dailyRecords, employee.id]);
    const employeeLeaves = useMemo(() => leaveRecords.filter(r => r.employeeId === employee.id).sort((a, b) => new Date(b.details.dateOfFiling).getTime() - new Date(a.details.dateOfFiling).getTime()), [leaveRecords, employee.id]);
    
    const summaryData = useMemo(() => {
        const monthlyRecords = employeeRecords.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth;
        });

        const totalMinutes = monthlyRecords.reduce((sum, record) => sum + calculateMinutes(record), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalMonthlyHours = `${hours}h ${minutes}m`;

        const leaveStatusCounts = employeeLeaves.reduce((acc, leave) => {
            acc[leave.status] = (acc[leave.status] || 0) + 1;
            return acc;
        }, {} as Record<LeaveStatus, number>);

        return {
            totalMonthlyHours,
            leaveStatusCounts,
            recentRecords: employeeRecords.slice(0, 3),
            recentLeaves: employeeLeaves.slice(0, 3)
        };
    }, [employeeRecords, employeeLeaves, currentYear, currentMonth]);


    const generateDtrPdf = (): jsPDF => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

        const FORM_WIDTH = 95;
        const GUTTER = 10;
        const LEFT_MARGIN = (pageWidth - (2 * FORM_WIDTH + GUTTER)) / 2;
        const OFFSET_X1 = LEFT_MARGIN;
        const OFFSET_X2 = LEFT_MARGIN + FORM_WIDTH + GUTTER;
        
        const formatTimePdf = (iso: string | null): string => {
            if (!iso) return '';
            const date = new Date(iso);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        };
        
        const generatePage = (offsetX: number) => {
            const center = offsetX + FORM_WIDTH / 2;

            doc.setFontSize(6);
            doc.text('Civil Service Form No. 48', offsetX + 5, 10);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('DAILY TIME RECORD', center, 17, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(employee.name.toUpperCase(), center, 27, { align: 'center' });
            doc.setLineWidth(0.2);
            doc.line(offsetX + 20, 28, offsetX + FORM_WIDTH - 20, 28);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text('(NAME)', center, 31, { align: 'center' });

            doc.setFontSize(8);
            doc.text('For the month of :', offsetX + 5, 37);
            doc.setFont('helvetica', 'bold');
            doc.text(`${monthName.toUpperCase()} ${selectedYear}`, offsetX + 35, 37);
            doc.setLineWidth(0.2);
            doc.line(offsetX + 33, 38, offsetX + FORM_WIDTH - 5, 38);
            doc.setFont('helvetica', 'normal');

            const officialHoursY = 44;
            const rightColX = offsetX + 45;

            doc.setFontSize(7);
            doc.text('Official hours for arrival\nand departure', offsetX + 5, officialHoursY, { align: 'left', lineHeightFactor: 1.5 });
            doc.text('Regular days ________________', rightColX, officialHoursY);
            doc.text('Saturdays ___________________', rightColX, officialHoursY + 5);

            const tableStartY = 54;

            const body = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(selectedYear, selectedMonth - 1, i);
                const dateString = date.toISOString().split('T')[0];
                const record = employeeRecords.find(r => r.date === dateString);
                const leave = employeeLeaves.find(l => l.status === 'Approved' && dateString >= l.startDate && dateString <= l.endDate);

                if (leave) {
                    body.push([{ content: i.toString() }, { content: leave.primaryLeaveType, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold' } }, '', '', '', '', '']);
                } else if (date.getDay() === 0 || date.getDay() === 6) {
                    body.push([{ content: i.toString() }, { content: date.getDay() === 0 ? 'SUNDAY' : 'SATURDAY', colSpan: 6, styles: { halign: 'center', fontStyle: 'italic' } }, '', '', '', '', '']);
                } else {
                    body.push([
                        i.toString(),
                        formatTimePdf(record?.timeIn),
                        formatTimePdf(record?.breakOut),
                        formatTimePdf(record?.breakIn),
                        formatTimePdf(record?.timeOut),
                        '', ''
                    ]);
                }
            }

            autoTable(doc, {
                startY: tableStartY,
                margin: { left: offsetX + 5 },
                head: [
                    [{ content: 'DAY', rowSpan: 2 }, { content: 'A.M.', colSpan: 2 }, { content: 'P.M.', colSpan: 2 }, { content: 'UNDERTIME', colSpan: 2 }],
                    ['ARRIVAL', 'DEPARTURE', 'ARRIVAL', 'DEPARTURE', 'HOURS', 'MINUTES']
                ],
                body: body,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 0.8, halign: 'center', valign: 'middle' },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.2, fontSize: 6, fontStyle: 'bold' },
                columnStyles: { 
                    0: { cellWidth: 8 }, 1: { cellWidth: 17 }, 2: { cellWidth: 17 }, 
                    3: { cellWidth: 17 }, 4: { cellWidth: 17 }, 5: { cellWidth: 9 }, 6: { cellWidth: 9 }
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY;
            const footerStartY = finalY + 5;

            doc.setFontSize(7);
            doc.text('I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.', offsetX + 5, footerStartY, { maxWidth: FORM_WIDTH - 10, align: 'justify', lineHeightFactor: 1.2 });

            const signatureY = footerStartY + 20;
            doc.line(offsetX + 20, signatureY, offsetX + FORM_WIDTH - 20, signatureY);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('SIGNATURE', center, signatureY + 4, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            const verificationY = signatureY + 10;
            doc.setFontSize(7);
            doc.text('Verified as to prescribed office hours.', offsetX + 5, verificationY);

            const headSignatureY = verificationY + 10;
            doc.line(offsetX + 20, headSignatureY, offsetX + FORM_WIDTH - 20, headSignatureY);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('IN CHARGE', center, headSignatureY + 4, { align: 'center' });
        };

        generatePage(OFFSET_X1);
        generatePage(OFFSET_X2);

        return doc;
    }

    const handlePrintTimesheet = () => {
        const doc = generateDtrPdf();
        const filename = `DTR_${employee.name.replace(/\s/g, '_')}_${selectedMonth}-${selectedYear}.pdf`;
        
        if (user.role === 'it') {
            doc.save(filename);
        } else {
            setPdfDoc(doc);
            setPdfFilename(filename);
        }
    };
    
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const formatTime = (isoString: string | null): string => isoString ? new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';


    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 animate-fade-in-down" onClick={onClose}>
            {pdfDoc && <PdfPreviewModal doc={pdfDoc} filename={pdfFilename} onClose={() => setPdfDoc(null)} />}
            {isEditingTimesheet && user.role === 'it' && (
                <TimesheetEditModal 
                    employee={employee}
                    startDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
                    endDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`}
                    dailyRecords={employeeRecords}
                    leaveRecords={employeeLeaves}
                    onSave={(updatedRecords) => onUpdateTimeLogs?.(updatedRecords)}
                    onClose={() => setIsEditingTimesheet(false)}
                />
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0">
                            {employee.photoUrl ? (
                                <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover rounded-full"/>
                            ) : (
                                <UserCircle className="w-full h-full text-gray-400"/>
                            )}
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{employee.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {employee.id} | Dept: {employee.department}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <RoleBadge role={employee.role} />
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {employee.employeeType}
                                    {(employee.employeeType === 'Permanent' || employee.employeeType === 'Casual') && employee.positionTitle ? ` - ${employee.positionTitle}` : ''}
                                </p>
                            </div>
                        </div>
                         {qrCodeDataUrl && (
                            <div className="text-center ml-auto flex-shrink-0">
                                <img src={qrCodeDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600" />
                                <button
                                    onClick={handleDownloadQr}
                                    className="mt-2 w-full flex justify-center items-center gap-1 py-1 px-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700"
                                >
                                    <Download className="h-4 w-4"/>
                                    Download
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 self-start ml-4">
                        <X className="h-6 w-6 text-gray-500"/>
                    </button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {/* --- Summary Section --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Time Log Summary Card */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-green-600"/> Time Log Summary</h4>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours this Month</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{summaryData.totalMonthlyHours}</p>
                            </div>
                            <div className="space-y-2 pt-2 border-t dark:border-gray-600">
                                <h5 className="font-semibold text-sm">Recent Activity</h5>
                                {summaryData.recentRecords.length > 0 ? summaryData.recentRecords.map(rec => (
                                    <div key={rec.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between items-center">
                                        <span>{rec.date}</span>
                                        <span className="font-mono text-right">{formatTime(rec.timeIn)} - {formatTime(rec.timeOut)}</span>
                                    </div>
                                )) : <p className="text-xs text-gray-500">No recent time logs.</p>}
                            </div>
                        </div>

                        {/* Leave Summary Card */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><CalendarOff className="h-5 w-5 text-amber-600"/> Leave Summary</h4>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Leave Balance</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{employee.leaveBalance} <span className="text-base font-medium">days</span></p>
                                <div className="flex justify-around text-xs mt-2">
                                    <span><StatusBadge status="Pending"/> {summaryData.leaveStatusCounts.Pending || 0}</span>
                                    <span><StatusBadge status="Approved"/> {summaryData.leaveStatusCounts.Approved || 0}</span>
                                    <span><StatusBadge status="Rejected"/> {summaryData.leaveStatusCounts.Rejected || 0}</span>
                                </div>
                            </div>
                             <div className="space-y-2 pt-2 border-t dark:border-gray-600">
                                <h5 className="font-semibold text-sm">Recent Requests</h5>
                                {summaryData.recentLeaves.length > 0 ? summaryData.recentLeaves.map(leave => (
                                    <div key={leave.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{leave.primaryLeaveType}</p>
                                            <p className="text-gray-500">{leave.startDate} to {leave.endDate}</p>
                                        </div>
                                        <StatusBadge status={leave.status} />
                                    </div>
                                )) : <p className="text-xs text-gray-500">No recent leave requests.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg dark:border-gray-700 space-y-4">
                        <h4 className="text-lg font-semibold">Print Timesheet</h4>
                         <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-sm">Month</label>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="w-full text-sm p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    {months.map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
                                </select>
                            </div>
                             <div className="flex-1">
                                <label className="text-sm">Year</label>
                                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-full text-sm p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                             </div>
                             {user.role === 'it' && onUpdateTimeLogs && (
                                <button onClick={() => setIsEditingTimesheet(true)} className="flex items-center gap-1 py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                                    <Edit className="h-4 w-4" /> Edit
                                </button>
                            )}
                            <button onClick={handlePrintTimesheet} className="flex items-center gap-1 py-2 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                                <FileDown className="h-4 w-4" /> Generate PDF
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-2">Full Leave History</h4>
                        <div className="max-h-48 overflow-y-auto border rounded-lg dark:border-gray-700">
                            <table className="min-w-full text-sm">
                                 <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                     <tr>
                                         <th className="p-2 text-left">Type</th>
                                         <th className="p-2 text-left">Start Date</th>
                                         <th className="p-2 text-left">End Date</th>
                                         <th className="p-2 text-left">Status</th>
                                     </tr>
                                 </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                     {employeeLeaves.length > 0 ? employeeLeaves.map(leave => (
                                         <tr key={leave.id}>
                                             <td className="p-2">{leave.primaryLeaveType}</td>
                                             <td className="p-2">{leave.startDate}</td>
                                             <td className="p-2">{leave.endDate}</td>
                                             <td className="p-2"><StatusBadge status={leave.status} /></td>
                                         </tr>
                                     )) : (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No leave records found.</td></tr>
                                     )}
                                  </tbody>
                            </table>
                        </div>
                    </div>

                </div>
                 <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Close</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
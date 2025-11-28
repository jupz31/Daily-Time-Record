import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyTimeRecord, EmployeeInfo, Department, LeaveRecord, User } from '../types';
import { FileDown } from './icons';
import PdfPreviewModal from './PdfPreviewModal';

interface DataExporterProps {
    user: User;
    records: DailyTimeRecord[];
    employees: EmployeeInfo[];
    departments: Department[];
    leaveRecords: LeaveRecord[];
    employeeCredentials: Record<string, { password: string, employeeId: string }>;
}

const DataExporter: React.FC<DataExporterProps> = ({ user, records, employees, departments, leaveRecords }) => {
    const today = new Date();
    const [csvStartDate, setCsvStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
    const [csvEndDate, setCsvEndDate] = useState(today.toISOString().split('T')[0]);
    const [csvDepartment, setCsvDepartment] = useState('All');
    
    const [pdfYear, setPdfYear] = useState(today.getFullYear());
    const [pdfMonth, setPdfMonth] = useState(today.getMonth() + 1);
    const [pdfDepartment, setPdfDepartment] = useState(departments[0]?.name || 'All');
    const [selectedEmployeesForPdf, setSelectedEmployeesForPdf] = useState<string[]>([]);

    const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
    const [pdfFilename, setPdfFilename] = useState('');

    const getFilteredRecordsForCsv = () => {
        return records.filter(r => {
            const recordDate = new Date(r.date);
            const start = new Date(csvStartDate);
            const end = new Date(csvEndDate);
            const isDeptMatch = csvDepartment === 'All' || r.department === csvDepartment;
            return recordDate >= start && recordDate <= end && isDeptMatch;
        });
    };
    
    const formatTimeCsv = (iso: string | null) => iso ? `"${new Date(iso).toLocaleTimeString()}"` : '';

    const exportToCsv = (data: any[], headers: string[], filename: string) => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
        
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportDtrCsv = () => {
        const filteredRecords = getFilteredRecordsForCsv();
        const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Time In', 'Break Out', 'Break In', 'Time Out'];
        const data = filteredRecords.map(r => ({
            date: r.date,
            id: r.employeeId,
            name: `"${r.employeeName}"`,
            department: r.department,
            timeIn: formatTimeCsv(r.timeIn),
            breakOut: formatTimeCsv(r.breakOut),
            breakIn: formatTimeCsv(r.breakIn),
            timeOut: formatTimeCsv(r.timeOut),
        }));
        exportToCsv(data, headers, `DTR_${csvDepartment}_${csvStartDate}_to_${csvEndDate}`);
    };
    
    const handleExportEmployeeCsv = () => {
        const headers = ['ID', 'Name', 'Department', 'Employee Type', 'Position Title', 'Username', 'Leave Balance'];
        const data = employees.map(e => ({
            id: e.id,
            name: `"${e.name}"`,
            department: e.department,
            employeeType: e.employeeType,
            positionTitle: `"${e.positionTitle || ''}"`,
            username: e.username || '',
            leaveBalance: e.leaveBalance
        }));
        exportToCsv(data, headers, 'Employee_List');
    };
    
    const handlePdfDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPdfDepartment(e.target.value);
        setSelectedEmployeesForPdf([]); // Reset selection on department change
    };

    const handleEmployeePdfSelect = (employeeId: string) => {
        setSelectedEmployeesForPdf(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const employeesInSelectedPdfDept = useMemo(() => {
        const filtered = pdfDepartment === 'All' ? employees : employees.filter(e => e.department === pdfDepartment);
        return filtered.sort((a,b) => a.name.localeCompare(b.name));
    }, [pdfDepartment, employees]);


    const generateDtrPdf = (employee: EmployeeInfo, year: number, month: number): jsPDF => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const daysInMonth = new Date(year, month, 0).getDate();

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
            doc.text(`${monthName.toUpperCase()} ${year}`, offsetX + 35, 37);
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
                const date = new Date(year, month - 1, i);
                const dateString = date.toISOString().split('T')[0];
                const record = records.find(r => r.employeeId === employee.id && r.date === dateString);
                const leave = leaveRecords.find(l => l.employeeId === employee.id && l.status === 'Approved' && dateString >= l.startDate && dateString <= l.endDate);

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
    };


    const handleExportDtrPdf = () => {
        const allDeptEmployees = pdfDepartment === 'All' ? employees : employees.filter(e => e.department === pdfDepartment);
        
        const employeesToPrint = selectedEmployeesForPdf.length > 0
            ? allDeptEmployees.filter(emp => selectedEmployeesForPdf.includes(emp.id))
            : allDeptEmployees;
            
        if (employeesToPrint.length === 0) {
            alert("No employees found for the selected criteria.");
            return;
        }

        const mainDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        employeesToPrint.forEach((emp, index) => {
            const singleEmployeeDoc = generateDtrPdf(emp, pdfYear, pdfMonth);
            if (index > 0) {
                mainDoc.addPage();
            }
            mainDoc.addImage(singleEmployeeDoc.output('datauristring'), 'PNG', 0, 0, 210, 297);
        });

        const filename = `DTRs_${pdfDepartment}_${pdfMonth}-${pdfYear}.pdf`;

        if (user.role === 'it') {
            mainDoc.save(filename);
        } else {
            setPdfDoc(mainDoc);
            setPdfFilename(filename);
        }
    };
    
    const inputStyle = "px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";
    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-8">
            {pdfDoc && <PdfPreviewModal doc={pdfDoc} filename={pdfFilename} onClose={() => setPdfDoc(null)} />}
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2"><FileDown className="h-5 w-5"/> Export DTRs</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PDF Export Section */}
                    <div className="p-4 border rounded-lg dark:border-gray-700 space-y-4">
                        <h4 className="font-semibold">Export as Official PDF</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Generates "Civil Service Form No. 48" for the selected month and year.</p>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium">Month</label>
                                <select value={pdfMonth} onChange={e => setPdfMonth(Number(e.target.value))} className={`mt-1 w-full ${inputStyle}`}>
                                    {months.map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Year</label>
                                <select value={pdfYear} onChange={e => setPdfYear(Number(e.target.value))} className={`mt-1 w-full ${inputStyle}`}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                             </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Department</label>
                            <select value={pdfDepartment} onChange={handlePdfDeptChange} className={`mt-1 w-full ${inputStyle}`}>
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Employees (Optional)</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">If none are selected, all employees in the department will be exported.</p>
                            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-900 space-y-1">
                                {employeesInSelectedPdfDept.length > 0 ? employeesInSelectedPdfDept.map(emp => (
                                    <div key={emp.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                        <input
                                            type="checkbox"
                                            id={`pdf-emp-${emp.id}`}
                                            checked={selectedEmployeesForPdf.includes(emp.id)}
                                            onChange={() => handleEmployeePdfSelect(emp.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label htmlFor={`pdf-emp-${emp.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                            {emp.name}
                                        </label>
                                    </div>
                                )) : <p className="text-xs text-gray-500 text-center p-2">No employees in this department.</p>}
                            </div>
                        </div>
                         <button onClick={handleExportDtrPdf} className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">Export as PDF</button>
                    </div>
                     {/* CSV Export Section */}
                    <div className="p-4 border rounded-lg dark:border-gray-700 space-y-4">
                        <h4 className="font-semibold">Export as Raw CSV Data</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export raw time logs within a specific date range.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Start Date</label>
                                <input type="date" value={csvStartDate} onChange={e => setCsvStartDate(e.target.value)} className={`mt-1 w-full ${inputStyle}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">End Date</label>
                                <input type="date" value={csvEndDate} onChange={e => setCsvEndDate(e.target.value)} className={`mt-1 w-full ${inputStyle}`} />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Department</label>
                            <select value={csvDepartment} onChange={e => setCsvDepartment(e.target.value)} className={`mt-1 w-full ${inputStyle}`}>
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleExportDtrCsv} className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">Export as CSV</button>
                    </div>
                </div>
            </div>
            
            <div className="border-t pt-8 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2"><FileDown className="h-5 w-5"/> Export Employee List</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Export a complete list of all employees and their basic information.</p>
                <div className="mt-4 flex gap-4">
                    <button onClick={handleExportEmployeeCsv} className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">Export Employee List as CSV</button>
                </div>
            </div>
        </div>
    );
};

export default DataExporter;
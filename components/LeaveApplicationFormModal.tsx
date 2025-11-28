import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeInfo, LeaveRecord, LeaveDetails, UserRole, LeaveStatus } from '../types';
import { X, Printer } from './icons';
import PdfPreviewModal from './PdfPreviewModal';
import { talisayanSealBase64 } from './assets';

interface LeaveApplicationFormModalProps {
    employee: EmployeeInfo;
    leaveRecords: LeaveRecord[];
    onClose: () => void;
    onSubmit: (newRecord: LeaveRecord) => void;
    userRole?: UserRole;
    reviewRecord?: LeaveRecord;
    leaveActions?: {
        update?: (record: LeaveRecord) => void;
        // FIX: Changed status type to LeaveStatus for consistency with App.tsx and to fix type errors.
        updateStatus: (recordId: string, status: LeaveStatus) => void;
    };
}

const FormInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string; className?: string, disabled?: boolean, readOnly?: boolean }> = ({ value, onChange, name, className = '', disabled = false, readOnly = false }) => (
    <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full bg-transparent focus:outline-none text-center text-sm ${className} ${disabled ? 'text-gray-500' : ''}`}
        autoComplete="off"
        disabled={disabled}
        readOnly={readOnly}
    />
);

const Checkbox: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean; }> = ({ checked, onChange, disabled = false }) => (
    <div className={`w-4 h-4 border border-black dark:border-gray-400 flex items-center justify-center ${disabled ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !disabled && onChange()}>
        {checked && <span className="font-bold text-sm">✓</span>}
    </div>
);

const LeaveApplicationFormModal: React.FC<LeaveApplicationFormModalProps> = ({ employee, leaveRecords, onClose, onSubmit, userRole, reviewRecord, leaveActions }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialDetails: LeaveDetails = {
        officeDepartment: employee.department,
        nameLast: employee.name.split(' ').slice(-1).join(' ') || '',
        nameFirst: employee.name.split(' ')[0] || '',
        nameMiddle: employee.name.split(' ').slice(1, -1).join(' '),
        dateOfFiling: todayStr,
        position: employee.positionTitle || employee.employeeType,
        salary: '',
        leaveType: { vacation: false, mandatoryForced: false, sick: false, maternity: false, paternity: false, specialPrivilege: false, soloParent: false, study: false, vawc: false, rehabilitation: false, specialLeaveWomen: false, specialEmergency: false, adoption: false, others: '' },
        vacationLocation: 'withinPhilippines',
        vacationLocationSpecify: '',
        sickLocation: undefined,
        sickLocationSpecify: '',
        specialLeaveWomenSpecify: '',
        studyLeaveMasters: false,
        studyLeaveBarBoard: false,
        otherPurposeMonetization: false,
        otherPurposeTerminal: false,
        numWorkingDays: '1',
        inclusiveDates: todayStr,
        commutation: 'Not Requested',
    };

    const [formData, setFormData] = useState<LeaveDetails>(reviewRecord ? reviewRecord.details : initialDetails);
    const [error, setError] = useState('');
    const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);

    // State for new interactive fields
    const [leaveStartDate, setLeaveStartDate] = useState(todayStr);
    const [leaveEndDate, setLeaveEndDate] = useState(todayStr);
    const [certificationDate, setCertificationDate] = useState(todayStr);
    const [vlTotal, setVlTotal] = useState<number | ''>(employee.leaveBalance);
    const [slTotal, setSlTotal] = useState<number | ''>(15);

    const isReviewMode = !!reviewRecord;
    const isFormDisabled = isReviewMode && userRole !== 'admin' && userRole !== 'it';
    const canAdminEdit = userRole === 'admin' || userRole === 'it';

    useEffect(() => {
        if (isReviewMode && reviewRecord) {
            setFormData(reviewRecord.details);
            const dates = reviewRecord.details.inclusiveDates.split(' to ');
            setLeaveStartDate(dates[0]);
            setLeaveEndDate(dates[1] || dates[0]);
        }
    }, [reviewRecord, isReviewMode]);
    
    useEffect(() => {
        if (leaveStartDate && leaveEndDate && !isFormDisabled) {
            const start = new Date(leaveStartDate);
            const end = new Date(leaveEndDate);

            if (start > end) {
                setError('Start date cannot be after end date.');
                setFormData(prev => ({ ...prev, numWorkingDays: '0' }));
                return;
            } else {
                setError('');
            }

            let count = 0;
            const curDate = new Date(start.valueOf());
            while (curDate <= end) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    count++;
                }
                curDate.setDate(curDate.getDate() + 1);
            }
            
            const formattedStart = start.toLocaleDateString('en-CA');
            const formattedEnd = end.toLocaleDateString('en-CA');

            setFormData(prev => ({
                ...prev,
                numWorkingDays: count.toString(),
                inclusiveDates: start.getTime() === end.getTime() ? formattedStart : `${formattedStart} to ${formattedEnd}`
            }));
        }
    }, [leaveStartDate, leaveEndDate, isFormDisabled]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (name: keyof Omit<LeaveDetails['leaveType'], 'others'>) => {
        setFormData(prev => {
            const newLeaveType = { ...prev.leaveType, [name]: !prev.leaveType[name] };
            return { ...prev, leaveType: newLeaveType };
        });
    };
    
    const handleRadioChange = (name: keyof LeaveDetails, value: any) => {
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const getPrimaryLeaveType = (): string => {
        const selected = Object.entries(formData.leaveType)
            .filter(([, value]) => value === true)
            .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
        
        if (formData.leaveType.others) {
            selected.push(formData.leaveType.others);
        }
        return selected.join(', ');
    };

    const validateAndSubmit = async () => {
        setError('');
        const checkedLeaves = Object.values(formData.leaveType).filter(v => v === true || (typeof v === 'string' && v.trim() !== '')).length;
        if (checkedLeaves === 0) {
            setError('Please select at least one type of leave.');
            return;
        }
        if (!formData.numWorkingDays || isNaN(parseInt(formData.numWorkingDays)) || parseInt(formData.numWorkingDays) <= 0) {
            setError('Please enter a valid number of working days.');
            return;
        }
        const newLeaveStart = new Date(leaveStartDate);
        const newLeaveEnd = new Date(leaveEndDate);

        if (newLeaveEnd < newLeaveStart) {
            setError('End date cannot be before the start date.');
            return;
        }

        const isOverlapping = leaveRecords.some(record => {
            if (record.employeeId !== employee.id || record.status === 'Rejected') return false;
            if (isReviewMode && record.id === reviewRecord?.id) return false; // Don't check against itself when editing
            const existingStart = new Date(record.startDate);
            const existingEnd = new Date(record.endDate);
            return (newLeaveStart <= existingEnd && newLeaveEnd >= existingStart);
        });

        if (isOverlapping) {
            setError('The selected dates conflict with an existing leave application.');
            return;
        }

        const newRecord: LeaveRecord = {
            id: `leave-${Date.now()}`,
            employeeId: employee.id,
            employeeName: `${formData.nameFirst} ${formData.nameMiddle} ${formData.nameLast}`,
            department: formData.officeDepartment,
            startDate: leaveStartDate,
            endDate: leaveEndDate,
            primaryLeaveType: getPrimaryLeaveType(),
            status: 'Pending',
            details: formData
        };
        onSubmit(newRecord);
    };
    
    const handleSaveChanges = () => {
        if (!reviewRecord || !leaveActions?.update) return;

        const updatedRecord: LeaveRecord = {
            ...reviewRecord,
            employeeName: `${formData.nameFirst} ${formData.nameMiddle} ${formData.nameLast}`,
            department: formData.officeDepartment,
            startDate: leaveStartDate,
            endDate: leaveEndDate,
            primaryLeaveType: getPrimaryLeaveType(),
            details: formData,
        };
        leaveActions.update(updatedRecord);
        onClose();
    };

    const generatePdf = async () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        const formWidth = pageWidth - margin * 2;
        const left = margin;
        let y = 10;
    
        const drawCheckboxPdf = (doc: jsPDF, x: number, y: number, isChecked: boolean) => {
            doc.setLineWidth(0.2).rect(x, y, 3, 3);
            if (isChecked) {
                doc.setFont('helvetica', 'bold').text('✓', x + 0.8, y + 2.5);
            }
        };
    
        // --- Header ---
        doc.setFontSize(7).setFont('helvetica', 'normal');
        doc.text('Civil Service Form No. 6', left, y);
        doc.text('Revised 2020', left, y + 3);
    
        const centerX = left + formWidth / 2;
        // Position logo to the left of the centered text
        // Text is centered at centerX. Est half-width ~22mm. 
        // Logo width 20mm. 
        // Logo X = centerX - 22 - 20 - 2 (padding) = centerX - 44
        try { doc.addImage(talisayanSealBase64, 'PNG', centerX - 45, y - 2, 20, 20); } catch (e) { console.error("Error adding seal image:", e); }
    
        doc.setFontSize(8).setFont('helvetica', 'bold');
        doc.text('Republic of the Philippines', centerX, y + 3, { align: 'center' });
        doc.text('MUNICIPALITY OF TALISAYAN', centerX, y + 7, { align: 'center' });
        doc.setFontSize(7).setFont('helvetica', 'normal');
        doc.text('(Agency Address)', centerX, y + 11, { align: 'center' });
        y += 18;
    
        doc.setFontSize(14).setFont('helvetica', 'bold');
        doc.text('APPLICATION FOR LEAVE', centerX, y, { align: 'center' });
        y += 8;
    
        // --- Section 1-5 ---
        const sec1_5_top = y;
        const col2_x = left + formWidth / 2;
        const name_col1_x = col2_x + 20;
        const name_col2_x = name_col1_x + 35;
        const pos_col_x = col2_x + 30;
    
        doc.setLineWidth(0.5).rect(left, y, formWidth, 20);
        doc.setLineWidth(0.2);
        doc.line(left, y + 10, left + formWidth, y + 10); // horizontal divider
        doc.line(col2_x, y, col2_x, y + 20); // main vertical divider
        doc.line(pos_col_x, y + 10, pos_col_x, y + 20); // vertical between pos and sal
    
        doc.setFontSize(7);
        doc.text('1. OFFICE/DEPARTMENT', left + 2, y + 4);
        doc.setFont('helvetica', 'bold').text(formData.officeDepartment, left + (formWidth / 4), y + 8, { align: 'center', maxWidth: (formWidth / 2) - 4 });
        
        doc.setFont('helvetica', 'normal').text('2. NAME: (Last)', col2_x + 2, y + 4);
        doc.text('(First)', name_col1_x + 2, y + 4);
        doc.text('(Middle)', name_col2_x + 2, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(formData.nameLast, col2_x + 11, y + 8, { align: 'center', maxWidth: 18 });
        doc.text(formData.nameFirst, name_col1_x + 17.5, y + 8, { align: 'center', maxWidth: 33 });
        doc.text(formData.nameMiddle, name_col2_x + 10, y + 8, { align: 'center', maxWidth: 18 });
    
        y += 10;
        doc.setFont('helvetica', 'normal').text('3. DATE OF FILING', left + 2, y + 4);
        doc.setFont('helvetica', 'bold').text(formData.dateOfFiling, left + (formWidth / 4), y + 8, { align: 'center', maxWidth: (formWidth / 2) - 4 });
        
        doc.setFont('helvetica', 'normal').text('4. POSITION', col2_x + 2, y + 4);
        doc.setFont('helvetica', 'bold').text(formData.position, col2_x + 16, y + 8, { align: 'center', maxWidth: 28 });
        
        doc.setFont('helvetica', 'normal').text('5. SALARY', pos_col_x + 2, y + 4);
        doc.setFont('helvetica', 'bold').text(formData.salary, pos_col_x + 15, y + 8, { align: 'center', maxWidth: 28 });
    
        y = sec1_5_top + 20; // Reset y to bottom of section
    
        // --- Section 6 ---
        const sec6_top = y;
        doc.setLineWidth(0.5).rect(left, y, formWidth, 115);
        doc.setFillColor(220, 220, 220).rect(left, y, formWidth, 5, 'F');
        doc.setFontSize(8).setFont('helvetica', 'bold').text('6. DETAILS OF APPLICATION', centerX, y + 3.5, { align: 'center' });
        y += 5;
    
        const sec6_mid_x = left + formWidth / 2;
        doc.setLineWidth(0.2).line(sec6_mid_x, y, sec6_mid_x, y + 72);
    
        // 6.A
        let yA = y;
        doc.setFontSize(7).setFont('helvetica', 'bold').text('6.A TYPE OF LEAVE TO BE AVAILED OF', left + 2, yA + 4);
        yA += 6;
        const leaveTypes = [
            { key: 'vacation', label: 'Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'mandatoryForced', label: 'Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'sick', label: 'Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'maternity', label: 'Maternity Leave (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)' },
            { key: 'paternity', label: 'Paternity Leave (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)' },
            { key: 'specialPrivilege', label: 'Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'soloParent', label: 'Solo Parent Leave (R.A. No. 8972 / CSC MC No. 8, s. 2004)' },
            { key: 'study', label: 'Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'vawc', label: '10-Day VAWC Leave (R.A. No. 9262 / CSC MC No. 15, s. 2005)' },
            { key: 'rehabilitation', label: 'Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)' },
            { key: 'specialLeaveWomen', label: 'Special Leave Benefits for Women (R.A. No. 9710 / CSC MC No. 25, s. 2010)' },
            { key: 'specialEmergency', label: 'Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)' },
            { key: 'adoption', label: 'Adoption Leave (R.A. No. 8552)' }
        ];
    
        doc.setFontSize(6.5).setFont('helvetica', 'normal');
        leaveTypes.forEach(lt => {
            drawCheckboxPdf(doc, left + 2, yA - 0.5, formData.leaveType[lt.key as keyof LeaveDetails['leaveType']] as boolean);
            const splitLabel = doc.splitTextToSize(lt.label, (formWidth/2)-10);
            doc.text(splitLabel, left + 6, yA + 2);
            yA += (splitLabel.length * 2.5) + 1.2;
        });
        yA += 1;
        doc.text('Others:', left + 2, yA + 2);
        doc.line(left + 12, yA + 3, left + 45, yA + 3);
        doc.setFont('helvetica', 'bold').text(formData.leaveType.others, left + 28, yA + 2.5, { align: 'center', maxWidth: 30 });
    
        // 6.B
        let yB = y;
        doc.setFontSize(7).setFont('helvetica', 'bold').text('6.B DETAILS OF LEAVE', sec6_mid_x + 2, yB + 4);
        yB += 6;
        doc.setFontSize(6.5).setFont('helvetica', 'italic');
        doc.text('In case of Vacation/Special Privilege Leave:', sec6_mid_x + 2, yB + 3);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.vacationLocation === 'withinPhilippines');
        doc.setFont('helvetica', 'normal').text('Within the Philippines', sec6_mid_x + 8, yB + 2);
        doc.line(sec6_mid_x + 35, yB + 3, sec6_mid_x + 55, yB + 3);
        doc.setFont('helvetica', 'bold').text(formData.vacationLocation === 'withinPhilippines' ? (formData.vacationLocationSpecify || 'Residence') : '', sec6_mid_x + 45, yB + 2.5, { align: 'center', maxWidth: 18 });
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.vacationLocation === 'abroad');
        doc.setFont('helvetica', 'normal').text('Abroad (Specify)', sec6_mid_x + 8, yB + 2);
        doc.line(sec6_mid_x + 28, yB + 3, sec6_mid_x + 55, yB + 3);
        doc.setFont('helvetica', 'bold').text(formData.vacationLocation === 'abroad' ? formData.vacationLocationSpecify : '', sec6_mid_x + 41.5, yB + 2.5, { align: 'center', maxWidth: 25 });
        
        yB += 4;
        doc.setFont('helvetica', 'italic').text('In case of Sick Leave:', sec6_mid_x + 2, yB + 3);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.sickLocation === 'inHospital');
        doc.setFont('helvetica', 'normal').text('In Hospital (Specify Illness)', sec6_mid_x + 8, yB + 2);
        doc.line(sec6_mid_x + 40, yB + 3, sec6_mid_x + 60, yB + 3);
        doc.setFont('helvetica', 'bold').text(formData.sickLocation === 'inHospital' ? formData.sickLocationSpecify : '', sec6_mid_x + 50, yB+2.5, { align: 'center', maxWidth: 18 });
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.sickLocation === 'outPatient');
        doc.setFont('helvetica', 'normal').text('Out Patient (Specify Illness)', sec6_mid_x + 8, yB + 2);
        doc.line(sec6_mid_x + 40, yB + 3, sec6_mid_x + 60, yB + 3);
        doc.setFont('helvetica', 'bold').text(formData.sickLocation === 'outPatient' ? formData.sickLocationSpecify : '', sec6_mid_x + 50, yB+2.5, { align: 'center', maxWidth: 18 });

        yB += 4;
        doc.setFont('helvetica', 'italic').text('In case of Special Leave Benefits for Women:', sec6_mid_x + 2, yB + 3);
        yB += 4;
        doc.setFont('helvetica', 'normal').text('(Specify Illness)', sec6_mid_x + 8, yB + 2);
        doc.line(sec6_mid_x + 28, yB + 3, sec6_mid_x + 60, yB + 3);
        doc.setFont('helvetica', 'bold').text(formData.specialLeaveWomenSpecify || '', sec6_mid_x + 44, yB + 2.5, { align: 'center', maxWidth: 30 });
        
        yB += 4;
        doc.setFont('helvetica', 'italic').text('In case of Study Leave:', sec6_mid_x + 2, yB + 3);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.studyLeaveMasters || false);
        doc.setFont('helvetica', 'normal').text("Completion of Master's Degree", sec6_mid_x + 8, yB + 2);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.studyLeaveBarBoard || false);
        doc.setFont('helvetica', 'normal').text("BAR/Board Examination Review", sec6_mid_x + 8, yB + 2);
        
        yB += 4;
        doc.setFont('helvetica', 'italic').text('Other purpose:', sec6_mid_x + 2, yB + 3);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.otherPurposeMonetization || false);
        doc.setFont('helvetica', 'normal').text("Monetization of Leave Credits", sec6_mid_x + 8, yB + 2);
        yB += 4;
        drawCheckboxPdf(doc, sec6_mid_x + 4, yB-0.5, formData.otherPurposeTerminal || false);
        doc.setFont('helvetica', 'normal').text("Terminal Leave", sec6_mid_x + 8, yB + 2);
    
        // 6.C and 6.D
        y = sec6_top + 72;
        doc.line(left, y, left + formWidth, y);
        doc.setFontSize(7).setFont('helvetica', 'bold').text('6.C NUMBER OF WORKING DAYS APPLIED FOR', left + 2, y + 4);
        doc.line(left + 2, y + 11, left + 45, y + 11);
        doc.text(formData.numWorkingDays, left + 23.5, y + 10, { align: 'center' });
        doc.setFont('helvetica', 'normal').text('INCLUSIVE DATES', left + 2, y + 15);
        doc.line(left + 2, y + 21, left + 45, y + 21);
        doc.setFont('helvetica', 'bold').text(formData.inclusiveDates, left + 23.5, y + 20, { align: 'center', maxWidth: 42 });
    
        doc.setFont('helvetica', 'bold').text('6.D COMMUTATION', sec6_mid_x + 2, y + 4);
        drawCheckboxPdf(doc, sec6_mid_x + 4, y + 6.5, formData.commutation === 'Not Requested');
        doc.setFont('helvetica', 'normal').text('Not Requested', sec6_mid_x + 8, y + 9);
        drawCheckboxPdf(doc, sec6_mid_x + 4, y + 10.5, formData.commutation === 'Requested');
        doc.setFont('helvetica', 'normal').text('Requested', sec6_mid_x + 8, y + 13);
    
        doc.line(sec6_mid_x + 20, y + 25, sec6_mid_x + 85, y + 25);
        doc.setFont('helvetica', 'normal').text('(Signature of Applicant)', sec6_mid_x + 52.5, y + 28, { align: 'center' });
    
        y = sec6_top + 115;
    
        // --- Section 7 ---
        const sec7_top = y;
        doc.setLineWidth(0.5).rect(left, y, formWidth, 60);
        doc.setFillColor(220, 220, 220).rect(left, y, formWidth, 5, 'F');
        doc.setFontSize(8).setFont('helvetica', 'bold').text('7. DETAILS OF ACTION ON APPLICATION', centerX, y + 3.5, { align: 'center' });
        y += 5;
    
        const sec7_mid_x = left + formWidth / 2;
        doc.setLineWidth(0.2).line(sec7_mid_x, y, sec7_mid_x, y + 38);
    
        // 7.A
        let yA2 = y;
        doc.setFontSize(7).setFont('helvetica', 'bold').text('7.A CERTIFICATION OF LEAVE CREDITS', left + 2, yA2 + 4);
        doc.setFont('helvetica', 'normal').text('As of', left + 5, yA2 + 9);
        doc.line(left + 15, yA2 + 10, left + 35, yA2 + 10);
        doc.setFont('helvetica', 'bold').text(certificationDate, left + 25, yA2 + 9.5, { align: 'center' });
    
        const daysAppliedFor = Number(formData.numWorkingDays) || 0;
        const isVacation = formData.leaveType.vacation || formData.leaveType.mandatoryForced;
        const isSick = formData.leaveType.sick;
        const vlApplied = isVacation ? daysAppliedFor : 0;
        const slApplied = !isVacation && isSick ? daysAppliedFor : 0;
        const vlBalance = (typeof vlTotal === 'number' ? vlTotal : 0) - vlApplied;
        const slBalance = (typeof slTotal === 'number' ? slTotal : 0) - slApplied;

        autoTable(doc, {
            startY: yA2 + 12,
            margin: { left: left + 2, right: pageWidth - (sec7_mid_x - 2) },
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 0.5, lineWidth: 0.2 },
            headStyles: { fillColor: [255, 255, 255], textColor: 0 },
            body: [
                [{ content: '' }, { content: 'Vacation Leave' }, { content: 'Sick Leave' }],
                [{ content: 'Total Earned' }, { content: vlTotal.toString() }, { content: slTotal.toString() }],
                [{ content: 'Less this application' }, { content: vlApplied.toString() }, { content: slApplied.toString() }],
                [{ content: 'Balance', styles: { fontStyle: 'bold' } }, { content: vlBalance.toString(), styles: { fontStyle: 'bold' } }, { content: slBalance.toString(), styles: { fontStyle: 'bold' } }]
            ]
        });
        yA2 = (doc as any).lastAutoTable.finalY + 5;
        doc.setFont('helvetica', 'bold').text('BREEZY B. MONTALBA', left + (formWidth / 4), yA2, { align: 'center' });
        doc.line(left + 5, yA2 + 1, left + (formWidth/2) - 5, yA2 + 1);
        doc.setFont('helvetica', 'normal').text('(Authorized Officer)', left + (formWidth / 4), yA2 + 4, { align: 'center' });
        
        // 7.B
        let yB2 = y;
        doc.setFontSize(7).setFont('helvetica', 'bold').text('7.B RECOMMENDATION', sec7_mid_x + 2, yB2 + 4);
        yB2 += 8;
        drawCheckboxPdf(doc, sec7_mid_x + 4, yB2-0.5, reviewRecord?.status === 'Approved');
        doc.setFont('helvetica', 'normal').text('For approval', sec7_mid_x + 8, yB2 + 2);
        yB2 += 4;
        drawCheckboxPdf(doc, sec7_mid_x + 4, yB2-0.5, reviewRecord?.status === 'Rejected');
        doc.setFont('helvetica', 'normal').text('For disapproval due to', sec7_mid_x + 8, yB2 + 2);
        doc.line(sec7_mid_x + 4, yB2 + 7, sec7_mid_x + (formWidth/2) - 4, yB2 + 7);
        doc.line(sec7_mid_x + 4, yB2 + 11, sec7_mid_x + (formWidth/2) - 4, yB2 + 11);
        
        yB2 += 22;
        doc.line(sec7_mid_x + 10, yB2, sec7_mid_x + (formWidth/2) - 10, yB2);
        doc.text('(Authorized Officer)', sec7_mid_x + (formWidth / 4), yB2 + 3, { align: 'center' });
    
        y = sec7_top + 38;
        doc.line(left, y, left + formWidth, y);
    
        // 7.C & 7.D
        doc.setFont('helvetica', 'bold').text('7.C APPROVED FOR:', left + 2, y + 4);
        doc.setFont('helvetica', 'normal').text('______ days with pay', left + 5, y + 9);
        doc.text('______ days without pay', left + 5, y + 13);
        doc.text('______ others (Specify)', left + 5, y + 17);
    
        doc.setFont('helvetica', 'bold').text('7.D DISAPPROVED DUE TO:', sec7_mid_x + 2, y + 4);
        doc.line(sec7_mid_x + 2, y + 8, sec7_mid_x + (formWidth/2) - 4, y + 8);
        doc.line(sec7_mid_x + 2, y + 12, sec7_mid_x + (formWidth/2) - 4, y + 12);
        doc.line(sec7_mid_x + 2, y + 16, sec7_mid_x + (formWidth/2) - 4, y + 16);
    
        y += 22;
        doc.setLineWidth(0.5);
        doc.line(left, y, left + formWidth, y);
        y += 5;
        doc.setFont('helvetica', 'bold').text('HON. CIRIACO A. TALINES', centerX, y, { align: 'center' });
        y += 3;
        doc.setFont('helvetica', 'normal').text('Municipal Mayor', centerX, y, { align: 'center' });
        y += 2;
        doc.line(centerX - 25, y, centerX + 25, y);
        y += 3;
        doc.text('(Authorized Official)', centerX, y, { align: 'center' });
    
        setPdfDoc(doc);
    };

    const handleApprove = () => {
        if (reviewRecord && leaveActions?.updateStatus) {
            leaveActions.updateStatus(reviewRecord.id, 'Approved');
            onClose();
        }
    };

    const handleReject = () => {
        if (reviewRecord && leaveActions?.updateStatus) {
            leaveActions.updateStatus(reviewRecord.id, 'Rejected');
            onClose();
        }
    };
    
    const leaveTypeKeys = (Object.keys(formData.leaveType) as Array<keyof LeaveDetails['leaveType']>).filter((key): key is keyof Omit<LeaveDetails['leaveType'], 'others'> => key !== 'others');
      
    const daysAppliedFor = Number(formData.numWorkingDays) || 0;
    const isVacation = formData.leaveType.vacation || formData.leaveType.mandatoryForced;
    const isSick = formData.leaveType.sick;
    const vlApplied = isVacation ? daysAppliedFor : 0;
    const slApplied = !isVacation && isSick ? daysAppliedFor : 0;
    const vlBalance = (typeof vlTotal === 'number' ? vlTotal : 0) - vlApplied;
    const slBalance = (typeof slTotal === 'number' ? slTotal : 0) - slApplied;

    return (
        <>
            {pdfDoc && <PdfPreviewModal doc={pdfDoc} filename="leave_application.pdf" onClose={() => setPdfDoc(null)} />}
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4" onClick={onClose}>
                <div style={{ fontFamily: 'Arial, sans-serif' }} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold">{isReviewMode ? 'Review' : 'Application for'} Leave</h2>
                        <button onClick={onClose}><X className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"/></button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto">
                        <div className="text-center mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Civil Service Form No. 6</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Revised 2020</p>
                            <img src={talisayanSealBase64} alt="Seal" className="h-16 w-16 mx-auto my-2" />
                            <p className="font-bold text-sm">Republic of the Philippines</p>
                            <p className="font-bold text-sm">MUNICIPALITY OF TALISAYAN</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">LGU Talisayan</p>
                            <h1 className="text-2xl font-bold mt-2">APPLICATION FOR LEAVE</h1>
                        </div>
                        
                        <div className="grid grid-cols-12 border-2 border-black dark:border-gray-600">
                           <div className="col-span-6 border-r-2 border-black dark:border-gray-600 p-1"><span className="text-xs">1. OFFICE/DEPARTMENT</span><FormInput name="officeDepartment" value={formData.officeDepartment} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                           <div className="col-span-6 p-1 grid grid-cols-3 gap-1">
                               <div><span className="text-xs">2. NAME (Last)</span><FormInput name="nameLast" value={formData.nameLast} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                               <div><span className="text-xs">(First)</span><FormInput name="nameFirst" value={formData.nameFirst} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                               <div><span className="text-xs">(Middle)</span><FormInput name="nameMiddle" value={formData.nameMiddle} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                           </div>
                           <div className="col-span-6 border-t-2 border-r-2 border-black dark:border-gray-600 p-1"><span className="text-xs">3. DATE OF FILING</span><FormInput name="dateOfFiling" value={formData.dateOfFiling} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                           <div className="col-span-4 border-t-2 border-r-2 border-black dark:border-gray-600 p-1"><span className="text-xs">4. POSITION</span><FormInput name="position" value={formData.position} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                           <div className="col-span-2 border-t-2 border-black dark:border-gray-600 p-1"><span className="text-xs">5. SALARY</span><FormInput name="salary" value={formData.salary} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                        </div>

                        <div className="border-2 border-black dark:border-gray-600 border-t-0">
                           <div className="bg-gray-200 dark:bg-gray-700 text-center font-bold text-sm p-1 border-b-2 border-black dark:border-gray-600">6. DETAILS OF APPLICATION</div>
                           <div className="grid grid-cols-2">
                               <div className="border-r-2 border-black dark:border-gray-600 p-2 space-y-1">
                                    <h3 className="font-bold text-xs border-b border-black dark:border-gray-600 mb-1">6.A TYPE OF LEAVE TO BE AVAILED OF</h3>
                                    {leaveTypeKeys.map(key => (
                                       <div key={key} className="flex items-center gap-2"><Checkbox checked={!!formData.leaveType[key]} onChange={() => handleCheckboxChange(key)} disabled={isFormDisabled} /><span className="text-xs">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} Leave</span></div>
                                    ))}
                                    <div className="flex items-center gap-2"><span className="text-xs">Others:</span><FormInput name="leaveType.others" value={formData.leaveType.others} onChange={(e) => setFormData(prev => ({...prev, leaveType: {...prev.leaveType, others: e.target.value}}))} disabled={isFormDisabled}/></div>
                               </div>
                               <div className="p-2 space-y-2">
                                    <h3 className="font-bold text-xs border-b border-black dark:border-gray-600 mb-1">6.B DETAILS OF LEAVE</h3>
                                    <div className="text-xs">
                                        <p className="font-bold">In case of Vacation/Special Privilege Leave:</p>
                                        <div className="pl-4">
                                            <div className="flex items-center gap-2"><Checkbox checked={formData.vacationLocation === 'withinPhilippines'} onChange={() => handleRadioChange('vacationLocation', 'withinPhilippines')} disabled={isFormDisabled} /><span>Within the Philippines</span></div>
                                            <div className="flex items-center gap-2"><Checkbox checked={formData.vacationLocation === 'abroad'} onChange={() => handleRadioChange('vacationLocation', 'abroad')} disabled={isFormDisabled} /><span>Abroad (Specify)</span><FormInput name="vacationLocationSpecify" value={formData.vacationLocationSpecify || ''} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                                        </div>
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold">In case of Sick Leave:</p>
                                        <div className="pl-4">
                                            <div className="flex items-center gap-2"><Checkbox checked={formData.sickLocation === 'inHospital'} onChange={() => handleRadioChange('sickLocation', 'inHospital')} disabled={isFormDisabled} /><span>In Hospital (Specify Illness)</span><FormInput name="sickLocationSpecify" value={formData.sickLocation === 'inHospital' ? formData.sickLocationSpecify || '' : ''} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                                            <div className="flex items-center gap-2"><Checkbox checked={formData.sickLocation === 'outPatient'} onChange={() => handleRadioChange('sickLocation', 'outPatient')} disabled={isFormDisabled} /><span>Out Patient (Specify Illness)</span><FormInput name="sickLocationSpecify" value={formData.sickLocation === 'outPatient' ? formData.sickLocationSpecify || '' : ''} onChange={handleInputChange} disabled={isFormDisabled}/></div>
                                        </div>
                                    </div>
                               </div>
                           </div>
                           <div className="grid grid-cols-2 border-t-2 border-black dark:border-gray-600">
                               <div className="border-r-2 border-black dark:border-gray-600 p-2">
                                   <h3 className="font-bold text-xs">6.C NUMBER OF WORKING DAYS APPLIED FOR</h3>
                                   <FormInput name="numWorkingDays" value={formData.numWorkingDays} onChange={() => {}} readOnly={true} className="bg-gray-100 dark:bg-gray-700"/>
                                   <h4 className="font-semibold text-xs mt-2">INCLUSIVE DATES</h4>
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} disabled={isFormDisabled} className="w-full text-xs p-1 border rounded bg-transparent border-gray-300 dark:border-gray-600 dark:[color-scheme:dark]"/>
                                        <span>to</span>
                                        <input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} disabled={isFormDisabled} className="w-full text-xs p-1 border rounded bg-transparent border-gray-300 dark:border-gray-600 dark:[color-scheme:dark]"/>
                                    </div>
                               </div>
                               <div className="p-2">
                                   <h3 className="font-bold text-xs">6.D COMMUTATION</h3>
                                   <div className="flex items-center gap-2 text-xs"><Checkbox checked={formData.commutation === 'Not Requested'} onChange={() => handleRadioChange('commutation', 'Not Requested')} disabled={isFormDisabled} /> Not Requested</div>
                                   <div className="flex items-center gap-2 text-xs"><Checkbox checked={formData.commutation === 'Requested'} onChange={() => handleRadioChange('commutation', 'Requested')} disabled={isFormDisabled} /> Requested</div>
                                   <div className="mt-12 text-center"><div className="border-t border-black dark:border-gray-500 w-2/3 mx-auto"></div><p className="text-xs font-semibold">(Signature of Applicant)</p></div>
                               </div>
                           </div>
                        </div>

                        <div className="border-2 border-black dark:border-gray-600 border-t-0">
                           <div className="bg-gray-200 dark:bg-gray-700 text-center font-bold text-sm p-1 border-b-2 border-black dark:border-gray-600">7. DETAILS OF ACTION ON APPLICATION</div>
                           <div className="grid grid-cols-2">
                               <div className="border-r-2 border-black dark:border-gray-600 p-2">
                                   <h3 className="font-bold text-xs">7.A CERTIFICATION OF LEAVE CREDITS</h3>
                                   <div className="text-sm my-2 flex items-center">As of<input type="date" value={certificationDate} onChange={e => setCertificationDate(e.target.value)} disabled={!canAdminEdit || isReviewMode} className="bg-transparent text-center text-sm p-0 ml-2 border-b border-black dark:border-gray-500 dark:[color-scheme:dark]" /></div>
                                   <table className="w-full text-center text-xs border-collapse border border-black dark:border-gray-500">
                                       <thead><tr className="bg-gray-100 dark:bg-gray-700/50"><th className="border border-black dark:border-gray-500 p-1"></th><th className="border border-black dark:border-gray-500 p-1">Vacation Leave</th><th className="border border-black dark:border-gray-500 p-1">Sick Leave</th></tr></thead>
                                       <tbody>
                                           <tr>
                                                <td className="border border-black dark:border-gray-500 p-1 text-left">Total Earned</td>
                                                <td className="border border-black dark:border-gray-500 p-0 h-6"><input type="number" value={vlTotal} onChange={(e) => setVlTotal(e.target.value === '' ? '' : Number(e.target.value))} disabled={!canAdminEdit || isFormDisabled} className="w-full h-full text-center bg-transparent focus:outline-none"/></td>
                                                <td className="border border-black dark:border-gray-500 p-0 h-6"><input type="number" value={slTotal} onChange={(e) => setSlTotal(e.target.value === '' ? '' : Number(e.target.value))} disabled={!canAdminEdit || isFormDisabled} className="w-full h-full text-center bg-transparent focus:outline-none"/></td>
                                           </tr>
                                           <tr><td className="border border-black dark:border-gray-500 p-1 text-left">Less this application</td><td className="border border-black dark:border-gray-500 p-1 h-6">{vlApplied > 0 ? vlApplied : ''}</td><td className="border border-black dark:border-gray-500 p-1 h-6">{slApplied > 0 ? slApplied : ''}</td></tr>
                                           <tr><td className="border border-black dark:border-gray-500 p-1 text-left font-bold">Balance</td><td className="border border-black dark:border-gray-500 p-1 h-6 font-bold">{vlBalance}</td><td className="border border-black dark:border-gray-500 p-1 h-6 font-bold">{slBalance}</td></tr>
                                       </tbody>
                                   </table>
                                   <div className="mt-8 text-center"><p className="font-bold">BREEZY B. MONTALBA</p><div className="border-t border-black dark:border-gray-500 w-2/3 mx-auto"></div><p className="text-xs font-semibold">(Authorized Officer)</p></div>
                               </div>
                               <div className="p-2"><h3 className="font-bold text-xs">7.B RECOMMENDATION</h3><div className="flex items-center space-x-2 my-1.5"><div className="w-4 h-4 border border-black dark:border-gray-400"></div><label className="text-xs">For approval</label></div><div className="flex items-start space-x-2 my-1.5"><div className="w-4 h-4 border border-black dark:border-gray-400 mt-1"></div><label className="text-xs">For disapproval due to ______________<br/>__________________________________</label></div><div className="mt-20 text-center"><div className="border-t border-black dark:border-gray-500 w-2/3 mx-auto"></div><p className="text-xs font-semibold">(Authorized Officer)</p></div></div>
                           </div>
                           <div className="grid grid-cols-2 border-t-2 border-black dark:border-gray-600">
                               <div className="border-r-2 border-black dark:border-gray-600 p-2"><h3 className="font-bold text-xs">7.C APPROVED FOR:</h3><p className="my-1 text-xs">_______ days with pay</p><p className="my-1 text-xs">_______ days without pay</p><p className="my-1 text-xs">_______ others (Specify)</p></div>
                               <div className="p-2"><h3 className="font-bold text-xs">7.D DISAPPROVED DUE TO:</h3><div className="h-16"></div></div>
                           </div>
                           <div className="border-t-2 border-black dark:border-gray-600 text-center p-2"><p className="font-bold">HON. CIRIACO A. TALINES</p><p className="text-sm">Municipal Mayor</p><div className="border-t border-black dark:border-gray-500 w-1/3 mx-auto my-1"></div><p className="text-xs font-semibold">(Authorized Official)</p></div>
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500 p-2">{error}</p>}
                    
                    <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-2 flex-shrink-0">
                        <button onClick={generatePdf} className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600"><Printer className="h-4 w-4"/> Print/Preview PDF</button>
                        
                        {isReviewMode && reviewRecord ? (
                             <>
                                {canAdminEdit && !isFormDisabled && (
                                     <button onClick={handleSaveChanges} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                                )}
                                {reviewRecord.status === 'Pending' && (userRole === 'admin' || userRole === 'head' || userRole === 'it') && leaveActions && (
                                    <>
                                        <button onClick={handleApprove} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">Approve</button>
                                        <button onClick={handleReject} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">Reject</button>
                                    </>
                                )}
                                <button onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Close</button>
                            </>
                        ) : (
                            <button onClick={validateAndSubmit} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">Submit Application</button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeaveApplicationFormModal;


import React, { useState, useEffect } from 'react';
import { EmployeeInfo, DailyTimeRecord, LeaveRecord } from '../types';
import { X, Edit } from './icons';

interface TimesheetEditModalProps {
  employee: EmployeeInfo;
  startDate: string;
  endDate: string;
  dailyRecords: DailyTimeRecord[];
  leaveRecords: LeaveRecord[];
  onSave: (updatedRecords: DailyTimeRecord[]) => void;
  onClose: () => void;
}

// Helper to convert ISO string to HH:mm format for time inputs, or return an empty string
const toTimeInput = (iso: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};


const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({ employee, startDate, endDate, dailyRecords, onSave, onClose }) => {
    const [editableRecords, setEditableRecords] = useState<Record<string, { timeIn: string, breakOut: string, breakIn: string, timeOut: string }>>({});
    const [days, setDays] = useState<string[]>([]);

    useEffect(() => {
        const newEditableRecords: Record<string, { timeIn: string, breakOut: string, breakIn: string, timeOut: string }> = {};
        const dateArray: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            // Use local date string to avoid timezone issues during iteration
            const dateString = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
            dateArray.push(dateString);

            const existingRecord = dailyRecords.find(r => r.date === dateString && r.employeeId === employee.id);
            
            newEditableRecords[dateString] = {
                timeIn: toTimeInput(existingRecord?.timeIn || null),
                breakOut: toTimeInput(existingRecord?.breakOut || null),
                breakIn: toTimeInput(existingRecord?.breakIn || null),
                timeOut: toTimeInput(existingRecord?.timeOut || null),
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }
        setDays(dateArray);
        setEditableRecords(newEditableRecords);
    }, [startDate, endDate, dailyRecords, employee.id]);

    const handleTimeChange = (date: string, field: 'timeIn' | 'breakOut' | 'breakIn' | 'timeOut', value: string) => {
        setEditableRecords(prev => {
            const record = prev[date] || { timeIn: '', breakOut: '', breakIn: '', timeOut: '' };
            return {
                ...prev,
                [date]: {
                    ...record,
                    [field]: value,
                },
            };
        });
    };

    const handleSave = () => {
        const updatedRecords: DailyTimeRecord[] = [];

        const toISOString = (dateStr: string, timeStr: string): string | null => {
            if (!timeStr) return null;
            return new Date(`${dateStr}T${timeStr}:00`).toISOString();
        };

        for (const date of days) {
            const edited = editableRecords[date];
            if (!edited) continue;

            const timeInISO = toISOString(date, edited.timeIn);
            const breakOutISO = toISOString(date, edited.breakOut);
            const breakInISO = toISOString(date, edited.breakIn);
            const timeOutISO = toISOString(date, edited.timeOut);

            const hasData = timeInISO || breakOutISO || breakInISO || timeOutISO;
            const originalRecord = dailyRecords.find(r => r.date === date && r.employeeId === employee.id);

            if (hasData) {
                updatedRecords.push({
                    ...(originalRecord || {
                        id: `${employee.id}-${date}`,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        department: employee.department,
                        date: date,
                    }),
                    timeIn: timeInISO,
                    breakOut: breakOutISO,
                    breakIn: breakInISO,
                    timeOut: timeOutISO,
                });
            } else if (originalRecord) {
                // If fields were cleared, send an update with null values
                updatedRecords.push({
                    ...originalRecord,
                    timeIn: null,
                    breakOut: null,
                    breakIn: null,
                    timeOut: null,
                });
            }
        }
        onSave(updatedRecords);
    };

    const inputStyle = "w-full text-center bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded-md p-1 text-sm";
    
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[80] p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Edit className="h-5 w-5"/> Edit Timesheet for {employee.name}</h3>
                    <button onClick={onClose}><X className="h-5 w-5"/></button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2">Time In</th>
                                <th className="p-2">Break Out</th>
                                <th className="p-2">Break In</th>
                                <th className="p-2">Time Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(date => (
                                <tr key={date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-2 font-medium">{date}</td>
                                    <td className="p-1"><input type="time" value={editableRecords[date]?.timeIn || ''} onChange={e => handleTimeChange(date, 'timeIn', e.target.value)} className={inputStyle} /></td>
                                    <td className="p-1"><input type="time" value={editableRecords[date]?.breakOut || ''} onChange={e => handleTimeChange(date, 'breakOut', e.target.value)} className={inputStyle} /></td>
                                    <td className="p-1"><input type="time" value={editableRecords[date]?.breakIn || ''} onChange={e => handleTimeChange(date, 'breakIn', e.target.value)} className={inputStyle} /></td>
                                    <td className="p-1"><input type="time" value={editableRecords[date]?.timeOut || ''} onChange={e => handleTimeChange(date, 'timeOut', e.target.value)} className={inputStyle} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Cancel</button>
                    <button type="button" onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default TimesheetEditModal;
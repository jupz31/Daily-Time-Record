import React, { useState, useMemo } from 'react';
import { DailyTimeRecord, LeaveRecord } from '../types';
import { Trash, ChevronUp, ChevronDown, ChevronUpDown, Edit, AlertTriangle } from './icons';

interface TimeLogTableProps {
  dailyRecords: DailyTimeRecord[];
  leaveRecords: LeaveRecord[];
  onClearLogs: () => void;
  department: string;
  isAdmin: boolean;
  onDeleteRecord: (recordId: string) => void;
  latestScannedRecordId?: string | null;
  onEditRecord?: (record: DailyTimeRecord) => void;
  canEditLogs?: boolean;
}

type SortKey = 'employeeName' | 'date' | 'timeIn' | 'totalHours';
type SortDirection = 'asc' | 'desc';

const OFFICIAL_START_TIME_HOURS = 8;
const OFFICIAL_START_TIME_MINUTES = 0;
const OFFICIAL_BREAK_OUT_TIME_HOURS = 12;
const OFFICIAL_BREAK_OUT_TIME_MINUTES = 0;
const MAX_BREAK_DURATION_MINUTES = 60;
const OFFICIAL_END_TIME_HOURS = 17; // 5:00 PM
const OFFICIAL_END_TIME_MINUTES = 0;

const formatTime = (isoString: string | null): React.ReactNode => {
    if (!isoString) return <span className="text-gray-400 dark:text-gray-500">-</span>;
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isEmployeeOnLeave = (employeeId: string, date: string, leaveRecords: LeaveRecord[]): string | null => {
    const leave = leaveRecords.find(l =>
        l.employeeId === employeeId &&
        date >= l.startDate &&
        date <= l.endDate &&
        l.status === 'Approved'
    );
    return leave ? leave.primaryLeaveType : null;
};

const calculateTimeInLateness = (timeIn: string | null, date: string): { isLate: boolean; duration: string } | null => {
    if (!timeIn) return null;

    const officialStart = new Date(date);
    officialStart.setHours(OFFICIAL_START_TIME_HOURS, OFFICIAL_START_TIME_MINUTES, 0, 0);
    const actualTimeIn = new Date(timeIn);

    if (actualTimeIn > officialStart) {
        const diffMs = actualTimeIn.getTime() - officialStart.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        
        let durationParts = [];
        if (hours > 0) durationParts.push(`${hours}h`);
        if (minutes > 0) durationParts.push(`${minutes}m`);

        return { isLate: true, duration: `${durationParts.join(' ')} late` };
    }

    return { isLate: false, duration: 'On Time' };
};

const calculateBreakOutLateness = (breakOut: string | null, date: string): { isLate: boolean; duration: string } | null => {
    if (!breakOut) return null;

    const officialBreakOut = new Date(date);
    officialBreakOut.setHours(OFFICIAL_BREAK_OUT_TIME_HOURS, OFFICIAL_BREAK_OUT_TIME_MINUTES, 0, 0);
    const actualBreakOut = new Date(breakOut);

    if (actualBreakOut > officialBreakOut) {
        const diffMs = actualBreakOut.getTime() - officialBreakOut.getTime();
        const minutes = Math.floor(diffMs / 60000);
        return { isLate: true, duration: `Break late by ${minutes}m` };
    }

    return { isLate: false, duration: '' };
};

const calculateBreakInLateness = (breakIn: string | null, breakOut: string | null): { isLate: boolean; duration: string } | null => {
    if (!breakIn || !breakOut) return null;

    const breakOutMs = new Date(breakOut).getTime();
    const breakInMs = new Date(breakIn).getTime();
    const breakDurationMs = breakInMs - breakOutMs;
    const maxBreakDurationMs = MAX_BREAK_DURATION_MINUTES * 60 * 1000;

    if (breakDurationMs > maxBreakDurationMs) {
        const overtimeMs = breakDurationMs - maxBreakDurationMs;
        const minutes = Math.floor(overtimeMs / 60000);
        return { isLate: true, duration: `Break over by ${minutes}m` };
    }

    return { isLate: false, duration: '' };
};

const calculateUndertime = (timeOut: string | null, date: string): { isUndertime: boolean; duration: string } | null => {
    if (!timeOut) return null;

    const officialEnd = new Date(date);
    officialEnd.setHours(OFFICIAL_END_TIME_HOURS, OFFICIAL_END_TIME_MINUTES, 0, 0);
    const actualTimeOut = new Date(timeOut);

    if (actualTimeOut < officialEnd) {
        const diffMs = officialEnd.getTime() - actualTimeOut.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        
        let durationParts = [];
        if (hours > 0) durationParts.push(`${hours}h`);
        if (minutes > 0) durationParts.push(`${minutes}m`);

        return { isUndertime: true, duration: `${durationParts.join(' ')} undertime` };
    }
    
    return { isUndertime: false, duration: '' };
};

const calculateTotalHours = (record: DailyTimeRecord): React.ReactNode => {
    const { timeIn, timeOut, breakIn, breakOut } = record;

    if (!timeIn) {
         return <span className="font-medium text-gray-500">Pending</span>;
    }
    if (!timeOut) {
        return <span className="font-medium text-green-500">In Progress</span>;
    }

    const timeInMs = new Date(timeIn).getTime();
    const timeOutMs = new Date(timeOut).getTime();

    let breakDurationMs = 0;
    if (breakIn && breakOut) {
        const breakInMs = new Date(breakIn).getTime();
        const breakOutMs = new Date(breakOut).getTime();
        if (breakInMs > breakOutMs) {
            breakDurationMs = breakInMs - breakOutMs;
        }
    }
    
    const totalWorkMs = timeOutMs - timeInMs - breakDurationMs;

    if (totalWorkMs < 0) return <span className="font-medium text-red-500">Invalid</span>;

    const hours = Math.floor(totalWorkMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalWorkMs % (1000 * 60 * 60)) / (1000 * 60));

    return <span className="font-bold text-gray-800 dark:text-gray-200">{`${hours}h ${minutes}m`}</span>;
};

const calculateTotalMinutes = (record: DailyTimeRecord): number => {
    const { timeIn, timeOut, breakIn, breakOut } = record;
    if (!timeIn) return -2; 
    if (!timeOut) return Infinity;
    const timeInMs = new Date(timeIn).getTime();
    const timeOutMs = new Date(timeOut).getTime();
    let breakDurationMs = 0;
    if (breakIn && breakOut) {
        const breakInMs = new Date(breakIn).getTime();
        const breakOutMs = new Date(breakOut).getTime();
        if (breakInMs > breakOutMs) breakDurationMs = breakInMs - breakOutMs;
    }
    const totalWorkMs = timeOutMs - timeInMs - breakDurationMs;
    if (totalWorkMs < 0) return -1;
    return Math.floor(totalWorkMs / 60000);
};

const TimeLogTable: React.FC<TimeLogTableProps> = ({ dailyRecords, leaveRecords, onClearLogs, department, isAdmin, onDeleteRecord, latestScannedRecordId, onEditRecord, canEditLogs }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  
    const recordsToDisplay = department === 'All'
    ? dailyRecords
    : dailyRecords.filter(log => log.department === department);

    const handleSort = (key: SortKey) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: key === 'date' ? 'desc' : 'asc' };
        });
    };

    const sortedRecords = useMemo(() => {
        const sortableItems = [...recordsToDisplay];
        sortableItems.sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;

            switch (sortConfig.key) {
                case 'employeeName':
                    return a.employeeName.localeCompare(b.employeeName) * direction;
                case 'date':
                    const dateComparison = b.date.localeCompare(a.date);
                    if (dateComparison !== 0) return dateComparison * direction;
                    const timeInA_date = a.timeIn ? new Date(a.timeIn).getTime() : 0;
                    const timeInB_date = b.timeIn ? new Date(b.timeIn).getTime() : 0;
                    return (timeInB_date - timeInA_date) * direction;
                case 'timeIn':
                    const timeInA = a.timeIn ? new Date(a.timeIn).getTime() : 0;
                    const timeInB = b.timeIn ? new Date(b.timeIn).getTime() : 0;
                    if (!timeInA && timeInB) return 1;
                    if (timeInA && !timeInB) return -1;
                    return (timeInA - timeInB) * direction;
                case 'totalHours':
                    const minutesA = calculateTotalMinutes(a);
                    const minutesB = calculateTotalMinutes(b);
                    return (minutesA - minutesB) * direction;
                default:
                    return 0;
            }
        });
        return sortableItems;
    }, [recordsToDisplay, sortConfig]);

    const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => {
        const isActive = sortConfig.key === sortKey;
        const isAsc = sortConfig.direction === 'asc';

        return (
             <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
                <button className="flex items-center gap-1 group focus:outline-none" onClick={() => handleSort(sortKey)}>
                    <span className={isActive ? "text-gray-900 dark:text-white" : "group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors"}>
                        {children}
                    </span>
                    {isActive ? (
                        isAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronUpDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </button>
            </th>
        );
    };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Time Logs for {department}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A log of all employee time-in and time-out records.</p>
        </div>
        {isAdmin && sortedRecords.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-2 py-2 px-3 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash className="h-4 w-4" />
            Clear All Logs
          </button>
        )}
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="max-h-[32rem] overflow-auto">
          {sortedRecords.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <SortableHeader sortKey="employeeName">Employee</SortableHeader>
                  <SortableHeader sortKey="date">Date</SortableHeader>
                  <SortableHeader sortKey="timeIn" className="text-center">Time In</SortableHeader>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Break Out</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Break In</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Out</th>
                  <SortableHeader sortKey="totalHours" className="text-center">Total Hours</SortableHeader>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                  {(isAdmin || canEditLogs) && <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedRecords.map((record) => {
                  const onLeaveType = isEmployeeOnLeave(record.employeeId, record.date, leaveRecords);
                  const timeInLateness = calculateTimeInLateness(record.timeIn, record.date);
                  const breakOutLateness = calculateBreakOutLateness(record.breakOut, record.date);
                  const breakInLateness = calculateBreakInLateness(record.breakIn, record.breakOut);
                  const undertime = calculateUndertime(record.timeOut, record.date);
                  const isHighlighted = record.id === latestScannedRecordId;

                  const remarks = [];
                  if (onLeaveType) {
                      remarks.push(<span key="leave" className="font-bold text-amber-600 dark:text-amber-400">{onLeaveType} Leave</span>);
                  } else if (record.onDuty && !record.timeIn) {
                      remarks.push(<span key="duty" className="font-bold text-blue-600 dark:text-blue-400">On Duty</span>);
                  } else {
                      if (timeInLateness) {
                          if (timeInLateness.isLate) {
                              remarks.push(<span key="timeInLate" className="font-medium text-red-500 dark:text-red-400">{timeInLateness.duration}</span>);
                          } else {
                              remarks.push(<span key="timeInOnTime" className="font-medium text-gray-800 dark:text-gray-200">{timeInLateness.duration}</span>);
                          }
                      }
                      if (breakOutLateness?.isLate) {
                          remarks.push(<span key="breakOutLate" className="text-xs block text-red-500 dark:text-red-400">{breakOutLateness.duration}</span>);
                      }
                      if (breakInLateness?.isLate) {
                          remarks.push(<span key="breakInLate" className="text-xs block text-red-500 dark:text-red-400">{breakInLateness.duration}</span>);
                      }
                       if (undertime?.isUndertime) {
                          remarks.push(<span key="undertime" className="font-medium text-orange-500 dark:text-orange-400">{undertime.duration}</span>);
                      }
                  }
                  if (record.isOutOfRange) {
                    remarks.push(<span key="outOfRange" className="font-bold text-yellow-500 dark:text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Out of Range</span>);
                  }


                  return (
                  <tr key={record.id} className={`${
                    record.onDuty ? "bg-blue-50 dark:bg-blue-900/20" :
                    onLeaveType ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } ${isHighlighted ? 'highlight-scan' : ''} transition-colors`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{record.employeeName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {record.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.date}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-mono ${timeInLateness?.isLate ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{formatTime(record.timeIn)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-mono ${breakOutLateness?.isLate ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{formatTime(record.breakOut)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-mono ${breakInLateness?.isLate ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{formatTime(record.breakIn)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-mono ${undertime?.isUndertime ? 'text-orange-500 dark:text-orange-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{formatTime(record.timeOut)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-mono">{calculateTotalHours(record)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-left">
                        {remarks.length > 0 ? <div className="space-y-1">{remarks.map((r, i) => <div key={i}>{r}</div>)}</div> : <span className="text-gray-400">-</span>}
                    </td>
                    {(isAdmin || canEditLogs) && (
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                                {canEditLogs && onEditRecord && (
                                     <button onClick={() => onEditRecord(record)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" aria-label="Edit record">
                                        <Edit className="h-5 w-5"/>
                                    </button>
                                )}
                                {isAdmin && (
                                    <button onClick={() => onDeleteRecord(record.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Delete record">
                                        <Trash className="h-5 w-5"/>
                                    </button>
                                )}
                            </div>
                        </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">No time logs recorded for this department yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeLogTable;
import React, { useMemo, useState, useEffect } from 'react';
import { User, EmployeeInfo, DailyTimeRecord, LeaveRecord, LeaveStatus } from '../types';
import { LogOut, UserCircle, QrCode, Clock, List, RoleDisplayBadge, MoreVertical } from './icons';
import ThemeToggle from './ThemeToggle';
import TimeLogTable from './TimeLogTable';
import QrScanner from './QrScanner';

interface EmployeeDashboardProps {
    user: User;
    employee: EmployeeInfo;
    dailyRecords: DailyTimeRecord[];
    leaveRecords: LeaveRecord[];
    onLogout: () => void;
    onFileLeave: () => void;
    onScanSuccess: (decodedData: any) => Promise<{ message: string, recordId: string }>;
}

type Tab = 'overview' | 'logs' | 'scanner';

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const statusMap = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${statusMap[status]}`}>{status}</span>;
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, employee, dailyRecords, leaveRecords, onLogout, onFileLeave, onScanSuccess }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [scanStatus, setScanStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [latestScannedRecordId, setLatestScannedRecordId] = useState<string | null>(null);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const handleScanSuccess = async (decodedData: any) => {
        try {
            const result = await onScanSuccess(decodedData);
            setScanStatus({ message: result.message, type: 'success' });
            setLatestScannedRecordId(result.recordId);
            setActiveTab('logs');
        } catch (error: any) {
            setScanStatus({ message: error.message, type: 'error' });
        }
    };
    
    const handleScanError = (error: string) => {
        setScanStatus({ message: error, type: 'error' });
    };

    const sortedLeaveRecords = useMemo(() => 
        [...leaveRecords].sort((a, b) => new Date(b.details.dateOfFiling).getTime() - new Date(a.details.dateOfFiling).getTime()),
    [leaveRecords]);

    const TABS: { id: Tab, name: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
        { id: 'overview', name: 'Overview', icon: UserCircle },
        { id: 'scanner', name: 'Scan DTR', icon: QrCode },
        { id: 'logs', name: 'My Logs', icon: Clock },
    ];

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isProfileMenuOpen && !target.closest('.profile-menu-wrapper')) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen]);


    const renderContent = () => {
        switch (activeTab) {
            case 'scanner':
                return (
                    <div className="max-w-md mx-auto">
                        <QrScanner 
                            onScanSuccess={handleScanSuccess} 
                            onScanError={handleScanError}
                            scanStatus={scanStatus}
                            clearScanStatus={() => setScanStatus(null)}
                        />
                    </div>
                );
            case 'logs':
                return (
                    <div className="p-0 sm:p-6 sm:bg-white sm:dark:bg-gray-800 sm:rounded-lg sm:shadow-md">
                        <TimeLogTable 
                            dailyRecords={dailyRecords} 
                            leaveRecords={leaveRecords}
                            onClearLogs={() => {}} 
                            department={employee.department}
                            isAdmin={false} 
                            onDeleteRecord={() => {}}
                            latestScannedRecordId={latestScannedRecordId}
                            canEditLogs={false}
                        />
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Leave History</h3>
                            <button onClick={onFileLeave} className="mb-4 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">File New Leave Application</button>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {sortedLeaveRecords.length > 0 ? sortedLeaveRecords.map(leave => (
                                            <tr key={leave.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{leave.primaryLeaveType}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">{leave.startDate} to {leave.endDate}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={leave.status} /></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">No leave requests found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                         <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Your Information</h3>
                             <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4">
                                {employee.photoUrl ? (
                                    <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover rounded-full"/>
                                ) : (
                                    <UserCircle className="w-full h-full text-gray-400"/>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold">{employee.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{employee.positionTitle || employee.employeeType}</p>
                            <p className="text-gray-600 dark:text-gray-400">{employee.department}</p>
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
                                <p className="font-semibold text-green-700 dark:text-green-300">Leave Balance</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{employee.leaveBalance} days</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-green-600 dark:text-green-400">Employee Portal</h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                        <RoleDisplayBadge role={user.role} />
                    </div>
                    <ThemeToggle />
                     <div className="hidden sm:block">
                        <button onClick={onLogout} className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-md"><LogOut className="h-4 w-4"/> Logout</button>
                    </div>
                    <div className="sm:hidden relative profile-menu-wrapper">
                            <button onClick={() => setProfileMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <MoreVertical className="h-5 w-5"/>
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
                                    <div className="p-2 border-b dark:border-gray-700">
                                        <p className="text-sm font-semibold">{user.username}</p>
                                        <RoleDisplayBadge role={user.role}/>
                                    </div>
                                    <button onClick={onLogout} className="w-full text-left flex items-center gap-2 p-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <LogOut className="h-4 w-4"/> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 pb-20">
                {renderContent()}
            </main>

            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-1 p-1">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default EmployeeDashboard;
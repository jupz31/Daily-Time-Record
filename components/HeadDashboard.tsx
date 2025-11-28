import React, { useState, useEffect } from 'react';
import { User, Department, EmployeeInfo, DailyTimeRecord, LeaveRecord, AppNotification, LeaveStatus } from '../types';
import { Home, QrCode, Users, Clock, CalendarOff, LogOut, RoleDisplayBadge, Settings, Crosshair, MapPin, MoreVertical } from './icons';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import QrScanner from './QrScanner';
import QrGenerator from './QrGenerator';
import EmployeeManager from './EmployeeManager';
import TimeLogTable from './TimeLogTable';
import LeaveManager from './LeaveManager';

interface HeadDashboardProps {
    user: User;
    department: Department;
    departments: Department[];
    employees: EmployeeInfo[];
    dailyRecords: DailyTimeRecord[];
    leaveRecords: LeaveRecord[];
    notifications: AppNotification[];
    employeeCredentials: Record<string, { password: string, employeeId: string }>;
    onLogout: () => void;
    onScanSuccess: (decodedData: any) => Promise<{ message: string, recordId: string }>;
    leaveActions: {
        update: (record: LeaveRecord) => void;
        delete: (recordId: string) => void;
        updateStatus: (recordId: string, status: LeaveStatus) => void;
    };
    employeeActions: {
        add: (employee: EmployeeInfo) => void;
        update: (employee: EmployeeInfo) => void;
        delete: (employeeId: string) => void;
    };
    departmentActions: {
        updateDetails: (departmentName: string, details: Partial<Department>) => void;
    };
    onMarkNotificationsAsRead: () => void;
}

type Tab = 'dashboard' | 'scanner' | 'generator' | 'team' | 'logs' | 'leaves' | 'settings';
const TABS: { id: Tab, name: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'scanner', name: 'Scanner', icon: QrCode },
    { id: 'team', name: 'My Team', icon: Users },
    { id: 'logs', name: 'Time Logs', icon: Clock },
    { id: 'leaves', name: 'Leaves', icon: CalendarOff },
    { id: 'settings', name: 'Settings', icon: Settings },
];

const DepartmentSettings: React.FC<{
    department: Department,
    onUpdate: (details: Partial<Department>) => void
}> = ({ department, onUpdate }) => {
    const [latitude, setLatitude] = useState(String(department.location.latitude));
    const [longitude, setLongitude] = useState(String(department.location.longitude));
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setIsFetching(true);
        setError('');
        setSuccess('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(String(position.coords.latitude));
                setLongitude(String(position.coords.longitude));
                setIsFetching(false);
            },
            () => {
                setError('Unable to retrieve location. Please grant permission.');
                setIsFetching(false);
            }
        );
    };

    const handleSave = () => {
        setError('');
        setSuccess('');
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon)) {
            setError('Latitude and Longitude must be valid numbers.');
            return;
        }
        onUpdate({ location: { latitude: lat, longitude: lon } });
        setSuccess('Location updated successfully!');
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

    return (
        <div className="max-w-md mx-auto p-4 border rounded-lg dark:border-gray-700 space-y-4">
            <h4 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5"/> Department Location</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set the official coordinates for your department office. This is used to verify employee scan locations.</p>
            <div className="flex items-center gap-2">
                <input type="number" placeholder="Latitude" value={latitude} onChange={e => setLatitude(e.target.value)} className={inputStyle} />
                <input type="number" placeholder="Longitude" value={longitude} onChange={e => setLongitude(e.target.value)} className={inputStyle} />
                 <button type="button" onClick={handleGetCurrentLocation} disabled={isFetching} className="p-2.5 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50" title="Get Current Location">
                    <Crosshair className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
            <button onClick={handleSave} className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">Save Changes</button>
        </div>
    );
};


const HeadDashboard: React.FC<HeadDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [scanStatus, setScanStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [latestScannedRecordId, setLatestScannedRecordId] = useState<string | null>(null);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

    const handleScanSuccess = async (decodedData: any) => {
        try {
            const result = await props.onScanSuccess(decodedData);
            setScanStatus({ message: result.message, type: 'success' });
            setLatestScannedRecordId(result.recordId);
        } catch (error: any) {
            setScanStatus({ message: error.message, type: 'error' });
        }
    };

    const handleScanError = (error: string) => {
        setScanStatus({ message: error, type: 'error' });
    };

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
                return <QrScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} scanStatus={scanStatus} clearScanStatus={() => setScanStatus(null)} />;
            case 'generator':
                return <QrGenerator departments={[props.department]} isHeadView={true} />;
            case 'team':
                return <EmployeeManager user={props.user} employees={props.employees} departments={[props.department]} dailyRecords={props.dailyRecords} leaveRecords={props.leaveRecords} employeeCredentials={props.employeeCredentials} onAdd={props.employeeActions.add} onUpdate={props.employeeActions.update} onDelete={props.employeeActions.delete} isHeadView={true} departmentFilter={props.department.name}/>
            case 'logs':
                return <TimeLogTable dailyRecords={props.dailyRecords} leaveRecords={props.leaveRecords} onClearLogs={() => {}} department={props.department.name} isAdmin={false} onDeleteRecord={() => {}} latestScannedRecordId={latestScannedRecordId} canEditLogs={false} />;
            case 'leaves':
                return <LeaveManager employees={props.employees} leaveRecords={props.leaveRecords} leaveActions={props.leaveActions} userRole="head" departmentFilter={props.department.name} />;
            case 'settings':
                return <DepartmentSettings department={props.department} onUpdate={(details) => props.departmentActions.updateDetails(props.department.name, details)} />;
            case 'dashboard':
            default:
                 const onLeaveToday = props.leaveRecords.filter(r => {
                     const today = new Date().toISOString().split('T')[0];
                     return r.status === 'Approved' && today >= r.startDate && today <= r.endDate;
                 }).length;
                 const pendingLeaves = props.leaveRecords.filter(r => r.status === 'Pending').length;
                return (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <h3 className="text-xl font-bold">Welcome, {props.user.username}</h3>
                            <p>You are managing the <span className="font-semibold">{props.department.name}</span> department.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><h4 className="font-medium text-blue-800 dark:text-blue-200">Team Members</h4><p className="text-3xl font-bold">{props.employees.length}</p></div>
                            <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg"><h4 className="font-medium text-green-800 dark:text-green-200">On Leave Today</h4><p className="text-3xl font-bold">{onLeaveToday}</p></div>
                            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pending Leave Requests</h4><p className="text-3xl font-bold">{pendingLeaves}</p></div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="md:flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <aside className="w-64 bg-white dark:bg-gray-800 p-4 space-y-2 flex-shrink-0 hidden md:flex md:flex-col">
                <h1 className="text-2xl font-bold text-center text-green-600 dark:text-green-400">Department Head</h1>
                <nav className="flex flex-col space-y-1 flex-grow">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <tab.icon className="h-5 w-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </aside>
             <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold capitalize">{props.department.name}</h2>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:flex items-center gap-4">
                            <RoleDisplayBadge role={props.user.role} />
                        </div>
                        <NotificationBell notifications={props.notifications} onOpen={props.onMarkNotificationsAsRead} />
                        <ThemeToggle />
                        <div className="hidden sm:block">
                            <button onClick={props.onLogout} className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-md"><LogOut className="h-4 w-4"/> Logout</button>
                        </div>
                        <div className="sm:hidden relative profile-menu-wrapper">
                            <button onClick={() => setProfileMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <MoreVertical className="h-5 w-5"/>
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
                                    <div className="p-2 border-b dark:border-gray-700">
                                        <p className="text-sm font-semibold">{props.user.username}</p>
                                        <RoleDisplayBadge role={props.user.role}/>
                                    </div>
                                    <button onClick={props.onLogout} className="w-full text-left flex items-center gap-2 p-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <LogOut className="h-4 w-4"/> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-6">
                    {renderContent()}
                </main>
                 <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 grid grid-cols-6 gap-1 p-1">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center gap-1 p-1 rounded-md text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            <tab.icon className="h-5 w-5" />
                            <span className="truncate">{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default HeadDashboard;
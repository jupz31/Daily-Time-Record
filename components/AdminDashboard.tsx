import React, { useState, useRef, useEffect } from 'react';
import {
    User, EmployeeInfo, Department, DailyTimeRecord, LeaveRecord,
    Project, Task, AppNotification, LeaveStatus
} from '../types';
import {
    Home, Users, Building, Clock, CalendarOff, Briefcase, Database, LogOut, FileDown, CalendarDays, Trash, ShieldCheck, Search, QrCode, RoleDisplayBadge, MapPin, MoreVertical, UserCircle
} from './icons';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import EmployeeManager from './EmployeeManager';
import DepartmentHeadManager from './DepartmentHeadManager';
import TimeLogTable from './TimeLogTable';
import LeaveManager from './LeaveManager';
import ProjectManager from './ProjectManager';
import DataExporter from './DataExporter';
import OnDutySchedulerModal from './OnDutySchedulerModal';
import { ConfirmModal } from './icons';
import QrGenerator from './QrGenerator';
import EmployeeMap from './EmployeeMap';


interface AdminDashboardProps {
    user: User;
    employees: EmployeeInfo[];
    departments: Department[];
    dailyRecords: DailyTimeRecord[];
    leaveRecords: LeaveRecord[];
    projects: Project[];
    tasks: Task[];
    notifications: AppNotification[];
    employeeCredentials: Record<string, { password: string, employeeId: string }>;
    onLogout: () => void;
    employeeActions: {
        add: (employee: EmployeeInfo) => void;
        update: (employee: EmployeeInfo) => void;
        delete: (employeeId: string) => void;
    };
    departmentActions: {
        add: (department: Department) => void;
        update: (department: Department, originalName: string) => void;
        delete: (departmentName: string) => void;
        updateDetails: (departmentName: string, details: Partial<Department>) => void;
    };
    leaveActions: {
        add: (record: LeaveRecord) => void;
        update: (record: LeaveRecord) => void;
        delete: (recordId: string) => void;
        updateStatus: (recordId: string, status: LeaveStatus) => void;
    };
    projectActions: {
        add: (project: Project) => void;
        update: (project: Project) => void;
        delete: (projectId: string) => void;
    };
    taskActions: {
        add: (task: Task) => void;
        update: (task: Task) => void;
        delete: (taskId: string) => void;
    };
    onClearLogs: (department: string) => void;
    onDeleteRecord: (recordId: string) => void;
    onScheduleOnDuty: (employeeId: string, date: string) => void;
    onMarkNotificationsAsRead: (id: string) => void;
    onRestoreBackup: (data: any) => boolean;
}

type Tab = 'dashboard' | 'employees' | 'departments' | 'logs' | 'leaves' | 'projects' | 'generator' | 'export' | 'system' | 'tracking';
const TABS: { id: Tab, name: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'departments', name: 'Departments', icon: Building },
    { id: 'logs', name: 'Time Logs', icon: Clock },
    { id: 'tracking', name: 'Tracking', icon: MapPin },
    { id: 'leaves', name: 'Leaves', icon: CalendarOff },
    { id: 'projects', name: 'Projects', icon: Briefcase },
    { id: 'generator', name: 'QR Code', icon: QrCode },
    { id: 'export', name: 'Export', icon: FileDown },
    { id: 'system', name: 'System', icon: ShieldCheck },
];

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [logDepartmentFilter, setLogDepartmentFilter] = useState('All');
    const [isConfirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const backupInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        const backupData = {
            departments: props.departments,
            employees: props.employees,
            dailyRecords: props.dailyRecords,
            leaveRecords: props.leaveRecords,
            projects: props.projects,
            tasks: props.tasks,
            notifications: props.notifications,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `hris-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    
    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable text.");
                const data = JSON.parse(text);
                props.onRestoreBackup(data);
            } catch (error) {
                console.error("Failed to parse backup file:", error);
            }
        };
        reader.readAsText(file);
        if (backupInputRef.current) backupInputRef.current.value = '';
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
            case 'employees':
                return <EmployeeManager user={props.user} employees={props.employees} departments={props.departments} dailyRecords={props.dailyRecords} leaveRecords={props.leaveRecords} employeeCredentials={props.employeeCredentials} onAdd={props.employeeActions.add} onUpdate={props.employeeActions.update} onDelete={props.employeeActions.delete} />;
            case 'departments':
                return <DepartmentHeadManager departments={props.departments} employees={props.employees} onAdd={props.departmentActions.add} onUpdate={props.departmentActions.update} onDelete={props.departmentActions.delete} />;
            case 'logs':
                return (
                     <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <label htmlFor="log-dept-filter" className="text-sm font-medium">Department:</label>
                                <select id="log-dept-filter" value={logDepartmentFilter} onChange={e => setLogDepartmentFilter(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-2 text-sm">
                                    <option value="All">All Departments</option>
                                    {props.departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsSchedulerOpen(true)} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"><CalendarDays className="h-4 w-4"/> Schedule On-Duty</button>
                                <button onClick={() => setConfirmClearLogsOpen(true)} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-md shadow-sm"><Trash className="h-4 w-4"/> Clear Logs</button>
                            </div>
                        </div>
                        <TimeLogTable dailyRecords={props.dailyRecords} leaveRecords={props.leaveRecords} onClearLogs={() => setConfirmClearLogsOpen(true)} department={logDepartmentFilter} isAdmin={true} onDeleteRecord={props.onDeleteRecord} canEditLogs={false}/>
                    </div>
                );
            case 'tracking':
                return <EmployeeMap departments={props.departments} dailyRecords={props.dailyRecords} employees={props.employees} />;
            case 'leaves':
                return <LeaveManager employees={props.employees} leaveRecords={props.leaveRecords} leaveActions={props.leaveActions} userRole="admin" departments={props.departments} />;
            case 'projects':
                return <ProjectManager projects={props.projects} tasks={props.tasks} employees={props.employees} projectActions={props.projectActions} taskActions={props.taskActions} />;
             case 'generator':
                return <div className="max-w-md mx-auto"><QrGenerator departments={props.departments} /></div>;
            case 'export':
                return <DataExporter user={props.user} records={props.dailyRecords} employees={props.employees} departments={props.departments} leaveRecords={props.leaveRecords} employeeCredentials={props.employeeCredentials} />;
            case 'system':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2"><Database className="h-5 w-5"/> System Backup & Restore</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Download a full backup of system data or restore from a file.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
                                <h4 className="font-semibold">Create Backup</h4>
                                <p className="text-sm">Download all system data as a single JSON file. Keep it in a safe place.</p>
                                <button onClick={handleBackup} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Download Backup</button>
                            </div>
                             <div className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
                                <h4 className="font-semibold">Restore from Backup</h4>
                                <p className="text-sm">Upload a backup file to restore system data. <span className="font-bold text-red-500">This will overwrite all current data.</span></p>
                                <input type="file" accept=".json" onChange={handleRestore} ref={backupInputRef} className="hidden" id="backup-upload"/>
                                <label htmlFor="backup-upload" className="w-full block text-center py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer">Upload and Restore</label>
                            </div>
                        </div>
                    </div>
                );
            case 'dashboard':
            default:
                 const employeeCount = props.employees.length;
                 const onLeaveToday = props.leaveRecords.filter(r => {
                     const today = new Date().toISOString().split('T')[0];
                     return r.status === 'Approved' && today >= r.startDate && today <= r.endDate;
                 }).length;
                 const pendingLeaves = props.leaveRecords.filter(r => r.status === 'Pending').length;
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><h4 className="font-medium text-blue-800 dark:text-blue-200">Total Employees</h4><p className="text-3xl font-bold">{employeeCount}</p></div>
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg"><h4 className="font-medium text-green-800 dark:text-green-200">On Leave Today</h4><p className="text-3xl font-bold">{onLeaveToday}</p></div>
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pending Leave Requests</h4><p className="text-3xl font-bold">{pendingLeaves}</p></div>
                        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><h4 className="font-medium text-indigo-800 dark:text-indigo-200">Total Projects</h4><p className="text-3xl font-bold">{props.projects.length}</p></div>
                    </div>
                );
        }
    };

    return (
        <div className="md:flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {isSchedulerOpen && <OnDutySchedulerModal employees={props.employees} departmentFilter="All" onClose={() => setIsSchedulerOpen(false)} onSchedule={props.onScheduleOnDuty} />}
            <ConfirmModal
                isOpen={isConfirmClearLogsOpen}
                onClose={() => setConfirmClearLogsOpen(false)}
                onConfirm={() => { props.onClearLogs(logDepartmentFilter); setConfirmClearLogsOpen(false); }}
                title="Clear Time Logs"
                message={`Are you sure you want to delete all time logs for "${logDepartmentFilter}"? This action cannot be undone.`}
            />
            {/* --- Desktop Sidebar --- */}
            <aside className="w-64 bg-white dark:bg-gray-800 p-4 space-y-2 flex-shrink-0 hidden md:flex md:flex-col">
                <h1 className="text-2xl font-bold text-center text-green-600 dark:text-green-400">Admin Panel</h1>
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
                {/* --- Header --- */}
                <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-semibold capitalize">{TABS.find(t => t.id === activeTab)?.name}</h2>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:flex items-center gap-4">
                            <span className="text-sm">Welcome, <span className="font-bold">{props.user.username}</span></span>
                            <RoleDisplayBadge role={props.user.role} />
                        </div>
                        <NotificationBell notifications={props.notifications.filter(n => n.recipientId === 'admin' || n.recipientId === props.user.employeeId)} onOpen={() => props.onMarkNotificationsAsRead('admin')} />
                        <ThemeToggle />
                        <div className="hidden sm:block">
                            <button onClick={props.onLogout} className="flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-md"><LogOut className="h-4 w-4"/> Logout</button>
                        </div>
                        {/* --- Mobile Profile Menu --- */}
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
                {/* --- Main Content --- */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-6">
                    {renderContent()}
                </main>
                {/* --- Mobile Bottom Navigation --- */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 grid grid-cols-5 gap-1 p-1">
                    {TABS.slice(0, 5).map(tab => (
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

export default AdminDashboard;
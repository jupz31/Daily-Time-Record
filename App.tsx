import React, { useState, useEffect, useCallback, useRef } from 'react';

import { 
    initialDepartments, 
    initialEmployees, 
    initialDailyRecords, 
    initialLeaveRecords, 
    initialProjects,
    initialTasks,
    initialNotifications
} from './initialData';
import { 
    User, 
    EmployeeInfo, 
    Department, 
    DailyTimeRecord, 
    LeaveRecord, 
    Project, 
    Task, 
    AppNotification,
    LeaveStatus
} from './types';

import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ItDashboard from './components/ItDashboard';
import HeadDashboard from './components/HeadDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import Notification from './components/Notification';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import LeaveFilingLoginModal from './components/LeaveFilingLoginModal';
import LeaveApplicationFormModal from './components/LeaveApplicationFormModal';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const TIMEOUT_WARNING_MS = 2 * 60 * 1000; // 2 minutes before timeout
const LOCATION_THRESHOLD_METERS = 200; // 200 meters tolerance

// --- Local Storage and Offline Support ---
const loadStateFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error loading state for ${key} from localStorage`, error);
    }
    return defaultValue;
};

const saveStateToLocalStorage = <T,>(key: string, value: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving state for ${key} to localStorage`, error);
    }
};

const App: React.FC = () => {
    // Main data states with localStorage persistence
    const [departments, setDepartments] = useState<Department[]>(() => loadStateFromLocalStorage('departments', initialDepartments));
    const [employees, setEmployees] = useState<EmployeeInfo[]>(() => loadStateFromLocalStorage('employees', initialEmployees));
    const [dailyRecords, setDailyRecords] = useState<DailyTimeRecord[]>(() => loadStateFromLocalStorage('dailyRecords', initialDailyRecords));
    const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => loadStateFromLocalStorage('leaveRecords', initialLeaveRecords));
    const [projects, setProjects] = useState<Project[]>(() => loadStateFromLocalStorage('projects', initialProjects));
    const [tasks, setTasks] = useState<Task[]>(() => loadStateFromLocalStorage('tasks', initialTasks));
    const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStateFromLocalStorage('notifications', initialNotifications));

    // Persist state changes to localStorage
    useEffect(() => { saveStateToLocalStorage('departments', departments); }, [departments]);
    useEffect(() => { saveStateToLocalStorage('employees', employees); }, [employees]);
    useEffect(() => { saveStateToLocalStorage('dailyRecords', dailyRecords); }, [dailyRecords]);
    useEffect(() => { saveStateToLocalStorage('leaveRecords', leaveRecords); }, [leaveRecords]);
    useEffect(() => { saveStateToLocalStorage('projects', projects); }, [projects]);
    useEffect(() => { saveStateToLocalStorage('tasks', tasks); }, [tasks]);
    useEffect(() => { saveStateToLocalStorage('notifications', notifications); }, [notifications]);

    // Auth and UI states
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [employeeCredentials, setEmployeeCredentials] = useState<Record<string, { password: string, employeeId: string }>>({});
    
    const [notification, setNotification] = useState<{ id: number, message: string, type: 'success' | 'error' } | null>(null);
    const [isSessionTimeoutModalOpen, setIsSessionTimeoutModalOpen] = useState(false);
    const [isLeaveSelectorOpen, setIsLeaveSelectorOpen] = useState(false);
    const [leaveFilingEmployee, setLeaveFilingEmployee] = useState<EmployeeInfo | null>(null);

    const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const showNotification = useCallback((message: string, type: 'success' | 'error') => {
        setNotification({ id: Date.now(), message, type });
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setIsSessionTimeoutModalOpen(false);
        showNotification('You have been logged out.', 'success');
    }, [showNotification]);

    const resetSessionTimeout = useCallback(() => {
        if (sessionWarningTimeoutRef.current) clearTimeout(sessionWarningTimeoutRef.current);
        if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
        
        sessionWarningTimeoutRef.current = setTimeout(() => {
            setIsSessionTimeoutModalOpen(true);
        }, SESSION_TIMEOUT_MS - TIMEOUT_WARNING_MS);
        
        sessionTimeoutRef.current = setTimeout(() => {
            handleLogout();
        }, SESSION_TIMEOUT_MS);
    }, [handleLogout]);

    useEffect(() => {
        const credentials: Record<string, { password: string, employeeId: string }> = {};
        employees.forEach(emp => {
            if (emp.username && emp.password) {
                credentials[emp.username.toLowerCase()] = { password: emp.password, employeeId: emp.id };
            }
        });
        credentials['it'] = { password: 'password', employeeId: 'it' };
        
        setEmployeeCredentials(credentials);
    }, [employees]);
    
    const handleExtendSession = () => {
        setIsSessionTimeoutModalOpen(false);
        resetSessionTimeout();
    };

    useEffect(() => {
        if (currentUser) {
            const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, resetSessionTimeout));
            resetSessionTimeout();
        }

        return () => {
            if (sessionWarningTimeoutRef.current) clearTimeout(sessionWarningTimeoutRef.current);
            if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
            const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => window.removeEventListener(event, resetSessionTimeout));
        };
    }, [currentUser, resetSessionTimeout]);

    const handleLogin = (username: string, password: string): boolean => {
        const lowerUsername = username.toLowerCase();
        const creds = employeeCredentials[lowerUsername];

        if (creds && creds.password === password) {
            let user: User | null = null;
            if (lowerUsername === 'it') {
                user = { username, role: 'it', employeeId: 'it' };
            } else {
                const employee = employees.find(e => e.id === creds.employeeId);
                if (employee) {
                    // Only Admin and Manager roles can log in with a password.
                    if (employee.role === 'Admin') user = { username: employee.username!, role: 'admin', employeeId: employee.id };
                    else if (employee.role === 'Manager') user = { username: employee.username!, role: 'head', department: employee.department, employeeId: employee.id };
                }
            }

            if (user) {
                setCurrentUser(user);
                showNotification(`Welcome, ${username}!`, 'success');
                return true;
            }
        }
        return false;
    };

    const handleEmployeeLogin = (employeeId: string): boolean => {
        const employee = employees.find(e => e.id === employeeId);

        // Only employees with the 'User' role can log in this way.
        if (employee && employee.username && employee.role === 'User') {
             const user: User = { 
                username: employee.username, 
                role: 'employee', 
                department: employee.department, 
                employeeId: employee.id 
            };
            setCurrentUser(user);
            showNotification(`Welcome, ${employee.name}!`, 'success');
            return true;
        }
        return false;
    };


    const handleAddLeaveRecord = (newRecord: LeaveRecord) => {
        setLeaveRecords(prev => [...prev, newRecord]);
        setLeaveFilingEmployee(null);
        showNotification('Leave application submitted successfully.', 'success');
        const head = employees.find(e => e.department === newRecord.department && e.role === 'Manager');
        const recipient = head ? head.id : 'admin';
        setNotifications(prev => [...prev, {id: `notif-${Date.now()}`, recipientId: recipient, message: `${newRecord.employeeName} filed a ${newRecord.primaryLeaveType}.`, read: false, createdAt: new Date().toISOString()}]);
    };
    
    const handleEmployeeSelectedForLeave = (employee: EmployeeInfo) => {
        setIsLeaveSelectorOpen(false);
        setLeaveFilingEmployee(employee);
    };

    const onScanSuccess = async (decodedData: any, user: User) => {
        // --- Geolocation Logic ---
        const getCurrentPosition = (): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });
        };
        
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371e3; // metres
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        let scanLocation: { latitude: number, longitude: number } | undefined;
        let isOutOfRange = false;
        let locationError: string | null = null;
        
        try {
            const position = await getCurrentPosition();
            scanLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        } catch (err) {
            console.error("Geolocation error:", err);
            locationError = "Could not get location. Scan will proceed without verification.";
        }
        // --- End Geolocation Logic ---


        // 1. Find the employee who is scanning
        const scanningEmployee = employees.find(e => e.id === user.employeeId);
        if (!scanningEmployee) throw new Error(`Scanning user with ID ${user.employeeId} not found.`);

        // 2. Validate QR payload
        if (!decodedData || typeof decodedData.department !== 'string') throw new Error('Invalid QR code. Not a department DTR code.');
        const qrDepartment = decodedData.department;
        const department = departments.find(d => d.name === qrDepartment);
        if (!department) throw new Error(`Department "${qrDepartment}" from QR code not found.`);

        // 3. Department match check
        if (scanningEmployee.department !== qrDepartment) throw new Error(`Access Denied: You can only scan the QR code for your own department (${scanningEmployee.department}).`);
        
        // 4. Geolocation check
        if (scanLocation && department.location) {
            const distance = calculateDistance(scanLocation.latitude, scanLocation.longitude, department.location.latitude, department.location.longitude);
            if (distance > LOCATION_THRESHOLD_METERS) {
                isOutOfRange = true;
                const adminAndIT = ['admin', 'it'];
                adminAndIT.forEach(roleId => {
                    setNotifications(prev => [...prev, {
                        id: `notif-${Date.now()}-${roleId}`,
                        recipientId: roleId,
                        message: `${scanningEmployee.name} scanned ${Math.round(distance)}m away from the ${department.name} office.`,
                        read: false,
                        createdAt: new Date().toISOString()
                    }]);
                });
            }
        }
        
        // 5. Time logging logic
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const timeInStart = new Date(todayStr); timeInStart.setHours(6, 0, 0, 0);
        const timeInEnd = new Date(todayStr); timeInEnd.setHours(8, 0, 0, 0);
        const breakOutStart = new Date(todayStr); breakOutStart.setHours(12, 0, 0, 0);
        const breakOutEnd = new Date(todayStr); breakOutEnd.setHours(12, 30, 0, 0);
        const breakInStart = new Date(todayStr); breakInStart.setHours(12, 31, 0, 0);
        const breakInEnd = new Date(todayStr); breakInEnd.setHours(13, 0, 0, 0);
        const timeOutStart = new Date(todayStr); timeOutStart.setHours(17, 0, 0, 0);
        const timeOutEnd = new Date(todayStr); timeOutEnd.setHours(23, 0, 0, 0);
        
        const employeeOnLeave = leaveRecords.find(l => l.employeeId === scanningEmployee.id && todayStr >= l.startDate && todayStr <= l.endDate && l.status === 'Approved');
        if (employeeOnLeave) throw new Error(`${scanningEmployee.name} is on ${employeeOnLeave.primaryLeaveType} today.`);
        
        let record = dailyRecords.find(r => r.employeeId === scanningEmployee.id && r.date === todayStr);
        let message = '';
        let updatedRecord: DailyTimeRecord;
        
        const createNewRecord = !record;
        if (createNewRecord) {
            record = {
                id: `${scanningEmployee.id}-${todayStr}`, employeeId: scanningEmployee.id, employeeName: scanningEmployee.name, department: scanningEmployee.department,
                date: todayStr, timeIn: null, breakOut: null, breakIn: null, timeOut: null
            };
        }
        updatedRecord = { ...record };
        
        const setScanDetails = (rec: DailyTimeRecord) => {
            rec.scanLocation = scanLocation;
            rec.isOutOfRange = isOutOfRange;
        };

        if (record?.onDuty) {
             if (!record.timeIn) {
                updatedRecord.timeIn = now.toISOString(); setScanDetails(updatedRecord);
                message = `On-duty Time In for ${scanningEmployee.name} successful.`;
            } else if (!record.timeOut) {
                updatedRecord.timeOut = now.toISOString(); setScanDetails(updatedRecord);
                message = `On-duty Time Out for ${scanningEmployee.name} successful.`;
            } else { throw new Error('On-duty record already complete for today.'); }
        } else {
            if (!record?.timeIn) {
                if (now < timeInStart || now > timeInEnd) throw new Error('Time In is only allowed between 6:00 AM and 8:00 AM.');
                updatedRecord.timeIn = now.toISOString(); setScanDetails(updatedRecord);
                message = `Time In for ${scanningEmployee.name} successful.`;
            } else if (!record.breakOut) {
                if (now < breakOutStart || now > breakOutEnd) throw new Error('Break Out is only allowed between 12:00 PM and 12:30 PM.');
                updatedRecord.breakOut = now.toISOString(); setScanDetails(updatedRecord);
                message = `Break Out for ${scanningEmployee.name} successful.`;
            } else if (!record.breakIn) {
                if (now < breakInStart || now > breakInEnd) throw new Error('Break In is only allowed between 12:31 PM and 1:00 PM.');
                updatedRecord.breakIn = now.toISOString(); setScanDetails(updatedRecord);
                message = `Break In for ${scanningEmployee.name} successful.`;
            } else if (!record.timeOut) {
                if (now < timeOutStart || now > timeOutEnd) throw new Error('Time Out is only allowed between 5:00 PM and 11:00 PM.');
                updatedRecord.timeOut = now.toISOString(); setScanDetails(updatedRecord);
                message = `Time Out for ${scanningEmployee.name} successful.`;
            } else { throw new Error(`${scanningEmployee.name} has already completed their time record for today.`); }
        }
    
        if (createNewRecord) {
            setDailyRecords(prev => [...prev, updatedRecord]);
        } else {
            setDailyRecords(prev => prev.map(r => r.id === record!.id ? updatedRecord : r));
        }
        
        if (isOutOfRange) message += " (Location was out of range)";
        if (locationError) message += ` (${locationError})`;

        return { message, recordId: record!.id };
    };

    const employeeActions = {
        add: (employee: EmployeeInfo) => {
            setEmployees(prev => [...prev, employee]);
            showNotification(`Employee ${employee.name} added.`, 'success');
        },
        update: (employee: EmployeeInfo) => {
            setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
            setDailyRecords(prev => prev.map(r => r.employeeId === employee.id ? { ...r, employeeName: employee.name, department: employee.department } : r));
            setLeaveRecords(prev => prev.map(r => r.employeeId === employee.id ? { ...r, employeeName: employee.name, department: employee.department } : r));
            showNotification(`Employee ${employee.name} updated.`, 'success');
        },
        delete: (employeeId: string) => {
            const empName = employees.find(e => e.id === employeeId)?.name || 'Unknown';
            setEmployees(prev => prev.filter(e => e.id !== employeeId));
            showNotification(`Employee ${empName} deleted.`, 'error');
        }
    };

    const departmentActions = {
        add: (department: Department) => {
            setDepartments(prev => [...prev, department]);
            showNotification(`Department ${department.name} added.`, 'success');
        },
        update: (department: Department, originalName: string) => {
            setDepartments(prev => prev.map(d => d.name === originalName ? department : d));
            setEmployees(prev => prev.map(e => e.department === originalName ? { ...e, department: department.name } : e));
            showNotification(`Department ${originalName} updated to ${department.name}.`, 'success');
        },
        delete: (departmentName: string) => {
            if (employees.some(e => e.department === departmentName)) {
                showNotification(`Cannot delete ${departmentName}. Reassign employees first.`, 'error');
                return;
            }
            setDepartments(prev => prev.filter(d => d.name !== departmentName));
            showNotification(`Department ${departmentName} deleted.`, 'error');
        },
        updateDetails: (departmentName: string, details: Partial<Department>) => {
            setDepartments(prev => prev.map(d => d.name === departmentName ? { ...d, ...details } : d));
            if (details.onTravel !== undefined) {
                showNotification(`${departmentName} travel mode ${details.onTravel ? 'activated' : 'deactivated'}.`, 'success');
            }
        }
    };
    
    const leaveActions = {
        add: handleAddLeaveRecord,
        update: (record: LeaveRecord) => {
            setLeaveRecords(prev => prev.map(r => r.id === record.id ? record : r));
            showNotification('Leave record updated.', 'success');
        },
        delete: (recordId: string) => {
            setLeaveRecords(prev => prev.filter(r => r.id !== recordId));
            showNotification('Leave record deleted.', 'error');
        },
        updateStatus: (recordId: string, status: LeaveStatus) => {
            const record = leaveRecords.find(r => r.id === recordId);
            if(record){
                setLeaveRecords(prev => prev.map(r => r.id === recordId ? { ...r, status } : r));
                showNotification(`${record.employeeName}'s leave has been ${status.toLowerCase()}.`, 'success');
                setNotifications(prev => [...prev, {id: `notif-${Date.now()}`, recipientId: record.employeeId, message: `Your ${record.primaryLeaveType} has been ${status.toLowerCase()}.`, read: false, createdAt: new Date().toISOString()}]);
            }
        }
    };

    const handleRestoreBackup = (backupData: any): boolean => {
        if (!backupData) {
            showNotification('Failed to read the backup file.', 'error');
            return false;
        }
        const requiredKeys = ['departments', 'employees', 'dailyRecords', 'leaveRecords', 'projects', 'tasks', 'notifications'];
        const hasAllKeys = requiredKeys.every(key => key in backupData && Array.isArray(backupData[key]));
        
        if (!hasAllKeys) {
            showNotification('Invalid backup file. The file is missing required data sections or has an incorrect format.', 'error');
            return false;
        }

        try {
            setDepartments(backupData.departments);
            setEmployees(backupData.employees);
            setDailyRecords(backupData.dailyRecords);
            setLeaveRecords(backupData.leaveRecords);
            setProjects(backupData.projects);
            setTasks(backupData.tasks);
            setNotifications(backupData.notifications);
            
            showNotification('System data restored successfully. The application will now reload.', 'success');
            setTimeout(() => window.location.reload(), 2000);
            return true;
        } catch (e) {
            console.error("Error applying backup data:", e);
            showNotification('An error occurred while restoring data. Please check the console.', 'error');
            return false;
        }
    };
    
    if (!currentUser) {
        return (
            <>
                <Login 
                    onLogin={handleLogin} 
                    onEmployeeLogin={handleEmployeeLogin}
                    employees={employees}
                    departments={departments}
                    onFileLeaveClick={() => setIsLeaveSelectorOpen(true)}
                />
                {isLeaveSelectorOpen && (
                    <LeaveFilingLoginModal 
                        employees={employees}
                        departments={departments}
                        onClose={() => setIsLeaveSelectorOpen(false)}
                        onSelectEmployee={handleEmployeeSelectedForLeave}
                    />
                )}
                {leaveFilingEmployee && (
                    <LeaveApplicationFormModal 
                        employee={leaveFilingEmployee}
                        onClose={() => setLeaveFilingEmployee(null)}
                        onSubmit={handleAddLeaveRecord}
                        leaveRecords={leaveRecords}
                    />
                )}
            </>
        );
    }
    
    const renderDashboard = () => {
        const employee = employees.find(e => e.id === currentUser.employeeId);
        
        switch (currentUser.role) {
            case 'admin':
                return <AdminDashboard 
                    user={currentUser}
                    employees={employees}
                    departments={departments}
                    dailyRecords={dailyRecords}
                    leaveRecords={leaveRecords}
                    projects={projects}
                    tasks={tasks}
                    notifications={notifications}
                    employeeCredentials={employeeCredentials}
                    onLogout={handleLogout}
                    employeeActions={employeeActions}
                    departmentActions={departmentActions}
                    leaveActions={leaveActions}
                    projectActions={{
                        add: (p) => setProjects(prev => [...prev, p]),
                        update: (p) => setProjects(prev => prev.map(i => i.id === p.id ? p : i)),
                        delete: (id) => setProjects(prev => prev.filter(i => i.id !== id)),
                    }}
                    taskActions={{
                        add: (t) => setTasks(prev => [...prev, t]),
                        update: (t) => setTasks(prev => prev.map(i => i.id === t.id ? t : i)),
                        delete: (id) => setTasks(prev => prev.filter(i => i.id !== id)),
                    }}
                    onClearLogs={(dept) => setDailyRecords(prev => dept === 'All' ? [] : prev.filter(r => r.department !== dept))}
                    onDeleteRecord={(id) => setDailyRecords(prev => prev.filter(r => r.id !== id))}
                    onScheduleOnDuty={(empId, date) => {
                        const emp = employees.find(e => e.id === empId)!;
                        setDailyRecords(prev => [...prev, {
                            id: `${empId}-${date}`, employeeId: empId, employeeName: emp.name, department: emp.department,
                            date: date, timeIn: null, breakOut: null, breakIn: null, timeOut: null, onDuty: true
                        }])
                    }}
                    onMarkNotificationsAsRead={(id) => setNotifications(prev => prev.map(n => n.recipientId === id ? { ...n, read: true } : n))}
                    onRestoreBackup={handleRestoreBackup}
                />;
            case 'it':
                 return <ItDashboard 
                    user={currentUser}
                    employees={employees}
                    departments={departments}
                    dailyRecords={dailyRecords}
                    leaveRecords={leaveRecords}
                    notifications={notifications}
                    employeeCredentials={employeeCredentials}
                    onLogout={handleLogout}
                    employeeActions={employeeActions}
                    departmentActions={departmentActions}
                    leaveActions={leaveActions}
                    onClearLogs={(dept) => setDailyRecords(prev => dept === 'All' ? [] : prev.filter(r => r.department !== dept))}
                    onDeleteRecord={(id) => setDailyRecords(prev => prev.filter(r => r.id !== id))}
                    onScheduleOnDuty={(empId, date) => {
                        const emp = employees.find(e => e.id === empId)!;
                        setDailyRecords(prev => [...prev, {
                            id: `${empId}-${date}`, employeeId: empId, employeeName: emp.name, department: emp.department,
                            date: date, timeIn: null, breakOut: null, breakIn: null, timeOut: null, onDuty: true
                        }])
                    }}
                    onUpdateTimeLogs={(updatedRecords) => {
                        const updatedIds = new Set(updatedRecords.map(r => r.id));
                        const otherRecords = dailyRecords.filter(r => !updatedIds.has(r.id));
                        setDailyRecords([...otherRecords, ...updatedRecords]);
                        showNotification('Timesheet updated successfully.', 'success');
                    }}
                    onMarkNotificationsAsRead={(id) => setNotifications(prev => prev.map(n => n.recipientId === id ? { ...n, read: true } : n))}
                    onRestoreBackup={handleRestoreBackup}
                />;
            case 'head':
                const department = departments.find(d => d.name === currentUser.department);
                if (!department) return <div>Error: Department not found.</div>;
                return <HeadDashboard 
                    user={currentUser}
                    department={department}
                    departments={departments}
                    employees={employees.filter(e => e.department === currentUser.department)}
                    dailyRecords={dailyRecords.filter(r => r.department === currentUser.department)}
                    leaveRecords={leaveRecords.filter(r => r.department === currentUser.department)}
                    notifications={notifications.filter(n => n.recipientId === currentUser.employeeId)}
                    employeeCredentials={employeeCredentials}
                    onLogout={handleLogout}
                    onScanSuccess={(data) => onScanSuccess(data, currentUser)}
                    leaveActions={leaveActions}
                    employeeActions={employeeActions}
                    departmentActions={departmentActions}
                    onMarkNotificationsAsRead={() => setNotifications(prev => prev.map(n => n.recipientId === currentUser.employeeId ? { ...n, read: true } : n))}
                />;
            case 'employee':
                if (!employee) return <div>Error: Employee record not found.</div>;
                return <EmployeeDashboard 
                    user={currentUser}
                    employee={employee}
                    dailyRecords={dailyRecords.filter(r => r.employeeId === currentUser.employeeId)}
                    leaveRecords={leaveRecords.filter(r => r.employeeId === currentUser.employeeId)}
                    onLogout={handleLogout}
                    onFileLeave={() => setLeaveFilingEmployee(employee)}
                    onScanSuccess={(data) => onScanSuccess(data, currentUser)}
                />;
            default:
                return <div>Invalid user role.</div>;
        }
    };

    return (
        <>
            {renderDashboard()}
            {notification && <Notification notification={notification} onDismiss={() => setNotification(null)} />}
            {isSessionTimeoutModalOpen && <SessionTimeoutModal onExtend={handleExtendSession} onLogout={handleLogout} />}
             {leaveFilingEmployee && !currentUser?.role.includes('employee') && (
                    <LeaveApplicationFormModal 
                        employee={leaveFilingEmployee}
                        onClose={() => setLeaveFilingEmployee(null)}
                        onSubmit={handleAddLeaveRecord}
                        leaveRecords={leaveRecords}
                        userRole={currentUser?.role}
                    />
            )}
        </>
    );
};

export default App;
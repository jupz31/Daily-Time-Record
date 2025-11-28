import React, { useState, useEffect } from 'react';
import { EmployeeInfo, Department, DailyTimeRecord, LeaveRecord, User, EmployeeRole } from '../types';
import { Users, UserPlus, Trash, Edit, FileText, Search, ChevronUp, ChevronDown, UserCircle, Key, ShieldCheck, Eye, EyeSlash, ConfirmModal, AlertTriangle } from './icons';
import EmployeeProfile from './EmployeeProfile';

interface EmployeeManagerProps {
    user: User;
    employees: EmployeeInfo[];
    departments: Department[];
    dailyRecords: DailyTimeRecord[];
    leaveRecords: LeaveRecord[];
    employeeCredentials: Record<string, { password: string, employeeId: string }>;
    onAdd: (employee: EmployeeInfo) => void;
    onUpdate: (employee: EmployeeInfo) => void;
    onDelete: (employeeId: string) => void;
    onUpdateTimeLogs?: (records: DailyTimeRecord[]) => void;
    isHeadView?: boolean;
    departmentFilter?: string;
}

type SortKey = 'name' | 'id';

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

const EmployeeManager: React.FC<EmployeeManagerProps> = (props) => {
    const { user, employees, departments, dailyRecords, leaveRecords, employeeCredentials, onAdd, onUpdate, onDelete, onUpdateTimeLogs, isHeadView = false, departmentFilter = '' } = props;
    
    const initialFormState: Omit<EmployeeInfo, 'leaveBalance'> & { leaveBalance: number | '' } = { 
        id: '', 
        name: '', 
        department: departmentFilter || departments[0]?.name || '', 
        employeeType: 'Permanent',
        positionTitle: '',
        username: '', 
        password: '', 
        leaveBalance: 15, 
        photoUrl: '',
        role: 'User'
    };


    const [isAdding, setIsAdding] = useState(false);
    const [editingEmp, setEditingEmp] = useState<EmployeeInfo | null>(null);
    const [viewingProfile, setViewingProfile] = useState<EmployeeInfo | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');
    const [deletingEmployee, setDeletingEmployee] = useState<EmployeeInfo | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [listDepartmentFilter, setListDepartmentFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    useEffect(() => {
        if(isHeadView) {
            setFormData(prev => ({...prev, department: departmentFilter}));
        }
    }, [isHeadView, departmentFilter]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
    
        if (name === 'leaveBalance') {
            if (value === '' || /^\d+$/.test(value)) {
                const newFormData = { 
                    ...formData, 
                    [name]: value === '' ? '' : parseInt(value, 10) 
                } as typeof formData;
                setFormData(newFormData);
            }
        } else {
            // FIX: Cast to unknown first to avoid TS error about leaveBalance type mismatch
            let newFormData = { ...formData, [name]: value } as unknown as typeof formData;
    
            if (name === 'employeeType' && value === 'Job Order') {
                newFormData.positionTitle = '';
                newFormData.leaveBalance = 0;
            }
    
            setFormData(newFormData);
        }
        
        setError('');
    };

    const validateForm = (isUpdate = false) => {
        const effectiveLeaveBalance = formData.leaveBalance === '' ? NaN : Number(formData.leaveBalance);
        if (!formData.id.trim() || !formData.name.trim() || !formData.department || ( !isHeadView && (formData.leaveBalance === '' || isNaN(effectiveLeaveBalance)) )) {
            return 'Employee ID, Name, Department, and a valid Leave Balance are required.';
        }
         if ((formData.employeeType === 'Permanent' || formData.employeeType === 'Casual') && !formData.positionTitle?.trim()) {
            return 'Position Title is required for Permanent and Casual employees.';
        }
        if (formData.username?.trim()){
            const usernameExists = Object.keys(employeeCredentials).some(username => 
                username.toLowerCase() === formData.username?.toLowerCase() &&
                (!isUpdate || (editingEmp && editingEmp.username?.toLowerCase() !== username.toLowerCase()))
            );
            if(usernameExists) return 'This username is already taken.';
        }
        if (!isUpdate) {
            if (employees.some(e => e.id === formData.id.trim())) {
                return 'An employee with this ID already exists.';
            }
            if(formData.username?.trim() && !formData.password.trim()){
                return 'Password is required when setting a username.';
            }
        }
        return '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm(!!editingEmp);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        let finalLeaveBalance: number;

        if (isHeadView) {
            finalLeaveBalance = editingEmp ? editingEmp.leaveBalance : initialFormState.leaveBalance as number;
        } else {
            finalLeaveBalance = Number(formData.leaveBalance);
        }
    
        const submissionData = { 
            ...formData, 
            leaveBalance: finalLeaveBalance 
        };

        if (editingEmp) {
            onUpdate(submissionData);
        } else {
            onAdd(submissionData);
        }
        cancelAction();
    };

    const startEdit = (emp: EmployeeInfo) => {
        setEditingEmp(emp);
        setFormData({
            id: emp.id,
            name: emp.name,
            department: emp.department,
            employeeType: emp.employeeType,
            positionTitle: emp.positionTitle || '',
            username: emp.username || '',
            password: '', 
            leaveBalance: emp.leaveBalance,
            photoUrl: emp.photoUrl || '',
            role: emp.role,
        });
        setIsAdding(false);
        setError('');
    };

    const cancelAction = () => {
        setIsAdding(false);
        setEditingEmp(null);
        setFormData(initialFormState);
        setError('');
        setIsPasswordVisible(false);
    };
    
    const handleSort = (key: SortKey) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                return { key, order: prevConfig.order === 'asc' ? 'desc' : 'asc' };
            }
            return { key, order: 'asc' };
        });
    };

    const handleResetPassword = (employeeId: string) => {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return;

        const newPassword = prompt(`Enter a new password for ${employee.name}:`);

        if (newPassword === null) {
            return;
        }

        if (newPassword.trim() === '') {
            alert('Password cannot be empty.');
            return;
        }

        onUpdate({ ...employee, password: newPassword.trim() });
    };

    const filteredEmployees = employees.filter(emp =>
        (listDepartmentFilter === 'All' || emp.department === listDepartmentFilter) &&
        (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    const sortedAndFilteredEmployees = [...filteredEmployees].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        const comparison = valA.localeCompare(valB, undefined, { numeric: sortConfig.key === 'id' });

        return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";
    
    const SortButton: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => {
        const isActive = sortConfig.key === sortKey;
        return (
            <button
                onClick={() => handleSort(sortKey)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                    isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                {children}
                {isActive && (
                    sortConfig.order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                )}
            </button>
        );
    };

    return (
        <>
            <ConfirmModal
                isOpen={!!deletingEmployee}
                onClose={() => setDeletingEmployee(null)}
                onConfirm={() => {
                    if (deletingEmployee) {
                        onDelete(deletingEmployee.id);
                        setDeletingEmployee(null);
                    }
                }}
                title="Confirm Deletion"
                message={`Are you sure you want to permanently delete ${deletingEmployee?.name}? This action cannot be undone.`}
                confirmText="Delete"
                icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
                iconBgClass="bg-red-100 dark:bg-red-900/50"
            />
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-5 w-5"/> Manage Employees
                    </h3>
                    {!isAdding && !editingEmp && (
                        <button onClick={() => { setIsAdding(true); setError(''); }} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
                            <UserPlus className="h-4 w-4" />
                            Add Employee
                        </button>
                    )}
                </div>

                 {(isAdding || editingEmp) && (
                     <form onSubmit={handleSubmit} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                         <h4 className="font-semibold">{editingEmp ? 'Edit Employee' : 'Add New Employee'}</h4>
                         <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                                    <input type="text" name="id" id="id" value={formData.id} onChange={handleInputChange} className={inputStyle} disabled={!!editingEmp} required/>
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={inputStyle} required/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                                    {isHeadView ? (
                                        <input type="text" value={formData.department} className={`${inputStyle} bg-gray-100 dark:bg-gray-800`} readOnly />
                                    ) : (
                                        <select name="department" id="department" value={formData.department} onChange={handleInputChange} className={inputStyle} required>
                                            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="leaveBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Leave Balance (days)</label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        name="leaveBalance" 
                                        id="leaveBalance" 
                                        value={formData.leaveBalance} 
                                        onChange={handleInputChange} 
                                        className={`${inputStyle} disabled:bg-gray-100 dark:disabled:bg-gray-800`} 
                                        disabled={isHeadView || formData.employeeType === 'Job Order'} 
                                        required={!isHeadView}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="employeeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Type</label>
                                    <select name="employeeType" id="employeeType" value={formData.employeeType} onChange={handleInputChange} className={inputStyle} required>
                                        <option value="Permanent">Permanent</option>
                                        <option value="Casual">Casual</option>
                                        <option value="Job Order">Job Order</option>
                                    </select>
                                </div>
                                {(formData.employeeType === 'Permanent' || formData.employeeType === 'Casual') && (
                                    <div>
                                        <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position Title</label>
                                        <input type="text" name="positionTitle" id="positionTitle" value={formData.positionTitle || ''} onChange={handleInputChange} className={inputStyle} required/>
                                    </div>
                                )}
                            </div>
                             {(user.role === 'admin' || user.role === 'it') && (
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><ShieldCheck className="h-4 w-4"/> Role</label>
                                    <select name="role" id="role" value={formData.role} onChange={handleInputChange} className={inputStyle} required>
                                        <option value="User">User</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            )}
                         </div>

                         <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><UserCircle className="h-4 w-4" /> Username (optional)</label>
                                <input type="text" name="username" id="username" value={formData.username} onChange={handleInputChange} className={inputStyle} />
                             </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Key className="h-4 w-4" /> Password</label>
                                <div className="relative">
                                    <input 
                                        type={isPasswordVisible ? 'text' : 'password'}
                                        name="password" 
                                        id="password" 
                                        value={formData.password} 
                                        onChange={handleInputChange} 
                                        className={`${inputStyle} pr-10`} 
                                        placeholder={editingEmp ? "Leave blank to keep unchanged" : ""}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                          type="button"
                                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                          className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                                          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                                        >
                                          {isPasswordVisible ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                             </div>
                         </div>
                         {error && <p className="text-sm text-red-500">{error}</p>}
                         <div className="flex gap-2 justify-end">
                            <button type="button" onClick={cancelAction} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">{editingEmp ? 'Save Changes' : 'Add Employee'}</button>
                         </div>
                     </form>
                )}
                
                <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search employees by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-green-500 focus:border-green-500 bg-gray-50 dark:bg-gray-700 sm:text-sm"
                            />
                        </div>
                        {!isHeadView && (
                            <div>
                                <select
                                    id="department-filter"
                                    value={listDepartmentFilter}
                                    onChange={(e) => setListDepartmentFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-green-500 focus:border-green-500 bg-gray-50 dark:bg-gray-700 sm:text-sm"
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(d => (
                                        <option key={d.name} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                     <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <span>Sort by:</span>
                        <SortButton sortKey="name">Name</SortButton>
                        <SortButton sortKey="id">ID</SortButton>
                     </div>
                </div>

                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {sortedAndFilteredEmployees.length > 0 ? (
                        sortedAndFilteredEmployees.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0">
                                     {emp.photoUrl ? (
                                        <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover rounded-full"/>
                                     ) : (
                                        <UserCircle className="w-full h-full text-gray-400"/>
                                     )}
                                   </div>
                                   <div>
                                       <p className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">{emp.name} <RoleBadge role={emp.role} /></p>
                                       <p className="text-sm text-gray-600 dark:text-gray-300">ID: {emp.id} {!isHeadView && `| Dept: ${emp.department}`}</p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {emp.employeeType}
                                            {(emp.employeeType === 'Permanent' || emp.employeeType === 'Casual') && emp.positionTitle && ` - ${emp.positionTitle}`}
                                        </p>
                                       {emp.username && <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><UserCircle className="h-3 w-3" /> {emp.username}</p>}
                                   </div>
                                </div>
                                <div className="flex gap-1">
                                    {user.role === 'admin' && emp.username && (
                                        <button 
                                            onClick={() => handleResetPassword(emp.id)}
                                            className="p-2 text-yellow-500 hover:text-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors" 
                                            aria-label="Reset Password"
                                            title="Reset Password"
                                        >
                                            <Key className="h-5 w-5"/>
                                        </button>
                                    )}
                                    <button onClick={() => setViewingProfile(emp)} className="p-2 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="View profile">
                                        <FileText className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => startEdit(emp)} className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" aria-label="Edit employee">
                                        <Edit className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => setDeletingEmployee(emp)} className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Delete employee">
                                        <Trash className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                             {searchQuery ? 'No employees match your search.' : 'No employees found. Add one to get started.'}
                         </p>
                    )}
                </div>
            </div>
            {viewingProfile && (
                <EmployeeProfile 
                    user={user}
                    employee={viewingProfile} 
                    dailyRecords={dailyRecords}
                    leaveRecords={leaveRecords}
                    onClose={() => setViewingProfile(null)}
                    onUpdateTimeLogs={onUpdateTimeLogs}
                />
            )}
        </>
    );
};

export default EmployeeManager;
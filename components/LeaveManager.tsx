import React, { useState, useMemo } from 'react';
import { EmployeeInfo, LeaveRecord, LeaveStatus, Department, UserRole } from '../types';
import LeaveApplicationFormModal from './LeaveApplicationFormModal';
import { CalendarOff, Search, Check, X, Trash, UserPlus, FileText } from './icons';

interface LeaveManagerProps {
    employees: EmployeeInfo[];
    leaveRecords: LeaveRecord[];
    leaveActions: {
        add?: (record: LeaveRecord) => void;
        update: (record: LeaveRecord) => void;
        delete: (recordId: string) => void;
        // FIX: Changed status type to LeaveStatus for consistency with App.tsx and to fix type errors.
        updateStatus: (recordId: string, status: LeaveStatus) => void;
    };
    userRole: UserRole;
    departments?: Department[];
    departmentFilter?: string;
}

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const statusMap = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${statusMap[status]}`}>{status}</span>;
};

const LeaveManager: React.FC<LeaveManagerProps> = ({ employees, leaveRecords, leaveActions, userRole, departments, departmentFilter }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'All'>('All');
    const [deptFilter, setDeptFilter] = useState(departmentFilter || 'All');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeInfo | null>(null);
    const [reviewingRecord, setReviewingRecord] = useState<LeaveRecord | null>(null);

    const filteredRecords = useMemo(() => {
        return leaveRecords
            .filter(r => departmentFilter ? r.department === departmentFilter : (deptFilter === 'All' || r.department === deptFilter))
            .filter(r => statusFilter === 'All' || r.status === statusFilter)
            .filter(r => r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => new Date(b.details.dateOfFiling).getTime() - new Date(a.details.dateOfFiling).getTime());
    }, [leaveRecords, departmentFilter, deptFilter, statusFilter, searchQuery]);
    
    const eligibleEmployeesForFiling = useMemo(() => 
        employees.filter(e => e.employeeType === 'Permanent' || e.employeeType === 'Casual'),
    [employees]);

    const handleOpenForm = () => {
        if (eligibleEmployeesForFiling.length > 0) {
            setSelectedEmployee(eligibleEmployeesForFiling[0]);
            setIsFormOpen(true);
        }
    };
    
    const handleFormSubmit = (record: LeaveRecord) => {
        if (leaveActions.add) {
            leaveActions.add(record);
        }
        setIsFormOpen(false);
        setSelectedEmployee(null);
    };

    const inputStyle = "px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

    return (
        <>
            {isFormOpen && selectedEmployee && (
                <LeaveApplicationFormModal
                    employee={selectedEmployee}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    leaveRecords={leaveRecords}
                    userRole={userRole}
                />
            )}
            {reviewingRecord && (
                <LeaveApplicationFormModal
                    employee={employees.find(e => e.id === reviewingRecord.employeeId)!}
                    onClose={() => setReviewingRecord(null)}
                    onSubmit={() => {}} // No-op for review mode
                    leaveRecords={leaveRecords}
                    reviewRecord={reviewingRecord}
                    leaveActions={leaveActions}
                    userRole={userRole}
                />
            )}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2"><CalendarOff className="h-5 w-5"/> Manage Leave Requests</h3>
                    {(userRole === 'admin' || userRole === 'it') && leaveActions.add && (
                         <button 
                             onClick={handleOpenForm}
                             disabled={eligibleEmployeesForFiling.length === 0}
                             className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                         >
                            <UserPlus className="h-4 w-4" />
                            File Leave for Employee
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Search by employee name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`w-full pl-10 ${inputStyle}`} />
                    </div>
                    {!departmentFilter && departments && (
                        <div>
                            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={`w-full ${inputStyle}`}>
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={`w-full ${inputStyle}`}>
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredRecords.length > 0 ? filteredRecords.map(leave => (
                                <tr key={leave.id}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{leave.employeeName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{leave.department}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{leave.primaryLeaveType}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{leave.startDate} to {leave.endDate}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={leave.status} /></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => setReviewingRecord(leave)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="View Details">
                                            <FileText className="h-5 w-5"/>
                                        </button>
                                        {leave.status === 'Pending' && (userRole === 'admin' || userRole === 'head' || userRole === 'it') && (
                                            <>
                                                <button onClick={() => leaveActions.updateStatus(leave.id, 'Approved')} className="p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" title="Approve"><Check className="h-5 w-5"/></button>
                                                <button onClick={() => leaveActions.updateStatus(leave.id, 'Rejected')} className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Reject"><X className="h-5 w-5"/></button>
                                            </>
                                        )}
                                        {(userRole === 'admin' || userRole === 'it') && (
                                            <button onClick={() => leaveActions.delete(leave.id)} className="p-2 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" title="Delete"><Trash className="h-5 w-5"/></button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No leave requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default LeaveManager;
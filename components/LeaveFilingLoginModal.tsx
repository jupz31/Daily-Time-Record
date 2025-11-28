import React, { useState, useMemo } from 'react';
import { EmployeeInfo, Department } from '../types';
import { X, UserCircle, Search, Building } from './icons';

interface LeaveFilingSelectorModalProps {
  employees: EmployeeInfo[];
  departments: Department[];
  onClose: () => void;
  onSelectEmployee: (employee: EmployeeInfo) => void;
}

const LeaveFilingLoginModal: React.FC<LeaveFilingSelectorModalProps> = ({ employees, departments, onClose, onSelectEmployee }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [error, setError] = useState('');
  
  const eligibleEmployees = useMemo(() => {
    if (!selectedDepartment) {
      return [];
    }
    return employees
      .filter(emp => emp.department === selectedDepartment && (emp.employeeType === 'Permanent' || emp.employeeType === 'Casual'))
      .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.id.includes(searchQuery))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, selectedDepartment, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedEmployeeId) {
        setError('Please select an employee to proceed.');
        return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!employee) {
        setError('Selected employee not found.');
        return;
    }
    
    onSelectEmployee(employee);
  };

  const inputStyle = "block w-full pl-10 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">File Leave for an Employee</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500"/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Select a department, then find and select the employee's name to begin.</p>
          <div>
            <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </label>
            <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                    id="department-select"
                    value={selectedDepartment}
                    onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedEmployeeId(''); // Reset employee selection when department changes
                    }}
                    className={inputStyle}
                    required
                >
                    <option value="">-- Select a Department --</option>
                    {departments.map(dept => (
                        <option key={dept.name} value={dept.name}>
                        {dept.name}
                        </option>
                    ))}
                </select>
            </div>
          </div>
          {selectedDepartment && (
            <>
              <div>
                <label htmlFor="employee-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Find Employee
                </label>
                <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="employee-search"
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={inputStyle}
                    />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                 {eligibleEmployees.length > 0 ? (
                    eligibleEmployees.map(emp => (
                         <div
                            key={emp.id}
                            onClick={() => setSelectedEmployeeId(emp.id)}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                selectedEmployeeId === emp.id 
                                ? 'bg-green-100 dark:bg-green-900' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                         >
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0">
                                {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover rounded-full"/> : <UserCircle className="w-full h-full text-gray-400"/>}
                            </div>
                            <div>
                                <p className={`font-medium ${selectedEmployeeId === emp.id ? 'text-green-800 dark:text-white' : ''}`}>{emp.name}</p>
                                <p className={`text-xs ${selectedEmployeeId === emp.id ? 'text-green-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>ID: {emp.id}</p>
                            </div>
                         </div>
                    ))
                 ) : (
                    <p className="text-center text-sm text-gray-500 py-4">No eligible employees found in this department.</p>
                 )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedEmployeeId}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveFilingLoginModal;

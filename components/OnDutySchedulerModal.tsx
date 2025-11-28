import React, { useState } from 'react';
import { EmployeeInfo } from '../types';
import { X, CalendarDays } from './icons';

interface OnDutySchedulerModalProps {
  employees: EmployeeInfo[];
  departmentFilter: string; // "All" or a specific department name
  onSchedule: (employeeId: string, date: string) => void;
  onClose: () => void;
}

const OnDutySchedulerModal: React.FC<OnDutySchedulerModalProps> = ({ employees, departmentFilter, onSchedule, onClose }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const filteredEmployees = (departmentFilter === 'All' ? employees : employees.filter(e => e.department === departmentFilter))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId || !date) {
      setError('Please select an employee and a date.');
      return;
    }

    onSchedule(employeeId, date);
    onClose();
  };

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-600"/> Schedule Special Duty
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500"/>
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Schedule an employee for on-duty work, typically for a weekend or public holiday.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employee
            </label>
            <select
              id="employee-select"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">-- Select an Employee --</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="duty-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              id="duty-date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputStyle}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Schedule Duty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnDutySchedulerModal;
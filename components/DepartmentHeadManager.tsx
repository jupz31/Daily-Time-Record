import React, { useState } from 'react';
import { Department, EmployeeInfo } from '../types';
import { Building, UserPlus, Trash, Edit, Search, MapPin, Crosshair } from './icons';

interface DepartmentHeadManagerProps {
    departments: Department[];
    employees: EmployeeInfo[];
    onAdd: (department: Department) => void;
    onUpdate: (department: Department, originalName: string) => void;
    onDelete: (departmentName: string) => void;
}

const DepartmentHeadManager: React.FC<DepartmentHeadManagerProps> = ({ departments, employees, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        campus: 'Main Campus', 
        latitude: '', 
        longitude: '' 
    });
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setIsFetchingLocation(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: String(position.coords.latitude),
                    longitude: String(position.coords.longitude)
                }));
                setIsFetchingLocation(false);
            },
            () => {
                setError('Unable to retrieve location. Please grant permission.');
                setIsFetchingLocation(false);
            }
        );
    };

    const validateForm = (isUpdate = false) => {
        if (!formData.name.trim()) return 'Department name is required.';
        if (!formData.campus.trim()) return 'Campus name is required.';
        if (!isUpdate && departments.some(d => d.name.toLowerCase() === formData.name.trim().toLowerCase())) return 'A department with this name already exists.';
        if(isUpdate && editingDept && departments.some(d => d.name.toLowerCase() === formData.name.trim().toLowerCase() && d.name !== editingDept.name)) return 'A department with this name already exists.';
        if (isNaN(parseFloat(formData.latitude)) || isNaN(parseFloat(formData.longitude))) return 'Latitude and Longitude must be valid numbers.';
        
        return '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm(!!editingDept);
        if (validationError) {
            setError(validationError);
            return;
        }

        const departmentData: Department = {
            name: formData.name.trim(),
            campus: formData.campus.trim(),
            location: {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude)
            },
            onTravel: editingDept ? editingDept.onTravel : false,
            photoUrl: editingDept ? editingDept.photoUrl : '',
        };

        if (editingDept) {
            onUpdate(departmentData, editingDept.name);
        } else {
            onAdd(departmentData);
        }
        cancelAction();
    };

    const startEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({ 
            name: dept.name,
            campus: dept.campus,
            latitude: String(dept.location.latitude),
            longitude: String(dept.location.longitude)
        });
        setIsAdding(false);
        setError('');
    };

    const cancelAction = () => {
        setIsAdding(false);
        setEditingDept(null);
        setFormData({ name: '', campus: 'Main Campus', latitude: '', longitude: '' });
        setError('');
    };

    const sortedDepartments = [...departments].sort((a,b) => a.name.localeCompare(b.name));
    const filteredDepartments = sortedDepartments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="h-5 w-5"/> Manage Departments
                </h3>
                {!isAdding && !editingDept && (
                     <button onClick={() => { setIsAdding(true); setError(''); }} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">
                        <UserPlus className="h-4 w-4" />
                        Add Department
                    </button>
                )}
            </div>
            
            {(isAdding || editingDept) && (
                 <form onSubmit={handleSubmit} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                     <h4 className="font-semibold">{editingDept ? 'Edit Department' : 'Add New Department'}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department Name</label>
                           <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={inputStyle} />
                        </div>
                         <div>
                           <label htmlFor="campus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campus</label>
                           <input type="text" name="campus" id="campus" value={formData.campus} onChange={handleInputChange} className={inputStyle} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location Coordinates</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="number" step="any" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleInputChange} className={inputStyle} />
                            <input type="number" step="any" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleInputChange} className={inputStyle} />
                            <button type="button" onClick={handleGetCurrentLocation} disabled={isFetchingLocation} className="p-2.5 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50" title="Get Current Location">
                                <Crosshair className={`h-5 w-5 ${isFetchingLocation ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                     </div>
                     {error && <p className="text-sm text-red-500">{error}</p>}
                     <div className="flex gap-2 justify-end">
                        <button type="button" onClick={cancelAction} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">{editingDept ? 'Save Changes' : 'Add Department'}</button>
                     </div>
                 </form>
            )}

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search departments by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-green-500 focus:border-green-500 bg-gray-50 dark:bg-gray-700 sm:text-sm"
                />
            </div>

            <div className="space-y-3">
                {filteredDepartments.length > 0 ? (
                    filteredDepartments.map(dept => {
                        const managers = employees.filter(e => e.department === dept.name && e.role === 'Manager');
                        return (
                        <div key={dept.name} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <div>
                               <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{dept.name}</p>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">{dept.campus}</span>
                                {dept.onTravel && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">ON TRAVEL</span>
                                )}
                               </div>
                               <p className="text-sm text-gray-600 dark:text-gray-300">
                                Managers: {managers.length > 0 ? managers.map(m => m.name).join(', ') : 'None assigned'}
                               </p>
                               <p className="text-xs text-gray-500 dark:text-gray-400">{employees.filter(e => e.department === dept.name).length} employees</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" /> Location</p>
                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400">Lat: {dept.location.latitude.toFixed(4)}</p>
                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400">Lon: {dept.location.longitude.toFixed(4)}</p>
                                </div>
                                <div className="flex items-center">
                                    <button onClick={() => startEdit(dept)} className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" aria-label="Edit department">
                                       <Edit className="h-5 w-5"/>
                                   </button>
                                   <button onClick={() => onDelete(dept.name)} className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Delete department">
                                       <Trash className="h-5 w-5"/>
                                   </button>
                                </div>
                            </div>
                        </div>
                    )})
                ) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                        {searchQuery ? 'No departments match your search.' : 'No departments found. Add one to get started.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DepartmentHeadManager;

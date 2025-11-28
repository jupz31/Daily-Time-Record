import React, { useMemo, useState } from 'react';
import { Department, DailyTimeRecord, EmployeeInfo } from '../types';
import { Building, MapPin, UserCircle, AlertTriangle, Clock, UsersGroup, X } from './icons';

interface EmployeeMapProps {
    departments: Department[];
    dailyRecords: DailyTimeRecord[];
    employees: EmployeeInfo[];
}

interface EmployeeScanInfo {
    employeeId: string;
    employeeName: string;
    location: { latitude: number; longitude: number };
    isOutOfRange: boolean;
    lastScanTime: string;
    lastScanType: string;
    department: string;
}

const EmployeeMap: React.FC<EmployeeMapProps> = ({ departments, dailyRecords, employees }) => {
    const [activeTooltip, setActiveTooltip] = useState<EmployeeScanInfo | null>(null);
    const [selectedCampus, setSelectedCampus] = useState<string>('All');
    const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);

    const campuses = useMemo(() => ['All', ...Array.from(new Set(departments.map(d => d.campus)))], [departments]);
    
    const filteredDepartments = useMemo(() => {
        if (selectedCampus === 'All') return departments;
        return departments.filter(d => d.campus === selectedCampus);
    }, [departments, selectedCampus]);

    const { bounds, employeeLocations } = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        const locations = filteredDepartments.map(d => d.location).filter(loc => loc);
        if (locations.length === 0) {
            return { bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 }, employeeLocations: [] };
        }
        
        const latitudes = locations.map(l => l.latitude);
        const longitudes = locations.map(l => l.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        const latPadding = (maxLat - minLat) * 0.2 || 0.005;
        const lonPadding = (maxLon - minLon) * 0.2 || 0.005;

        const bounds = { minLat: minLat - latPadding, maxLat: maxLat + latPadding, minLon: minLon - lonPadding, maxLon: maxLon + lonPadding };

        const todaysRecords = dailyRecords.filter(r => r.date === todayStr && r.scanLocation);
        const latestScans = new Map<string, DailyTimeRecord>();

        for (const record of todaysRecords) {
            const scanPriority = ['timeOut', 'breakIn', 'breakOut', 'timeIn'];
            let latestTime = 0;
            for (const type of scanPriority) {
                if (record[type as keyof DailyTimeRecord]) {
                    latestTime = new Date(record[type as keyof DailyTimeRecord] as string).getTime();
                    break;
                }
            }
            if(latestTime === 0) continue;

            const existing = latestScans.get(record.employeeId);
            if (!existing) {
                latestScans.set(record.employeeId, record);
            } else {
                let existingLatestTime = 0;
                for (const type of scanPriority) {
                    if (existing[type as keyof DailyTimeRecord]) {
                        existingLatestTime = new Date(existing[type as keyof DailyTimeRecord] as string).getTime();
                        break;
                    }
                }
                if (latestTime > existingLatestTime) {
                    latestScans.set(record.employeeId, record);
                }
            }
        }
        
        const visibleDepartments = new Set(filteredDepartments.map(d => d.name));
        const employeeLocations: EmployeeScanInfo[] = Array.from(latestScans.values())
            .filter(record => visibleDepartments.has(record.department))
            .map(record => {
                const scanPriority = ['timeOut', 'breakIn', 'breakOut', 'timeIn'];
                let lastScanTime = '';
                let lastScanType = '';
                for (const type of scanPriority) {
                    if (record[type as keyof DailyTimeRecord]) {
                        lastScanTime = new Date(record[type as keyof DailyTimeRecord] as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        lastScanType = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        break;
                    }
                }
                return {
                    employeeId: record.employeeId,
                    employeeName: record.employeeName,
                    location: record.scanLocation!,
                    isOutOfRange: !!record.isOutOfRange,
                    lastScanTime,
                    lastScanType,
                    department: record.department,
                };
            });

        return { bounds, employeeLocations };
    }, [filteredDepartments, dailyRecords]);
    
    const presentEmployeesInDept = useMemo(() => {
        if (!viewingDepartment) return [];
        const todayStr = new Date().toISOString().split('T')[0];
        
        const presentRecords = dailyRecords
            .filter(r => r.date === todayStr && r.department === viewingDepartment.name && !r.isOutOfRange && r.timeIn && !r.timeOut)
            .map(r => {
                 const scanPriority = ['timeOut', 'breakIn', 'breakOut', 'timeIn'];
                 let lastScanTime = '';
                 for (const type of scanPriority) {
                     if (r[type as keyof DailyTimeRecord]) {
                         lastScanTime = new Date(r[type as keyof DailyTimeRecord] as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                         break;
                     }
                 }
                 return { ...employees.find(e => e.id === r.employeeId), lastScanTime };
            });
        
        return presentRecords.filter(e => e.id); // Filter out any potential undefined employees
    }, [viewingDepartment, dailyRecords, employees]);

    const getPosition = (lat: number, lon: number) => {
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLon - bounds.minLon;
        if (latRange <= 0 || lonRange <= 0) return { top: '50%', left: '50%' };
        const top = ((bounds.maxLat - lat) / latRange) * 100;
        const left = ((lon - bounds.minLon) / lonRange) * 100;
        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5"/> Employee Live Tracking
                </h3>
                 <div className="flex items-center gap-2">
                    <label htmlFor="campus-filter" className="text-sm font-medium">Campus:</label>
                    <select id="campus-filter" value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-2 text-sm">
                        {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <div className="flex items-center gap-4 text-xs p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                    <span className="font-semibold">Legend:</span>
                    <div className="flex items-center gap-1"><Building className="h-4 w-4 text-blue-500"/> Department</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div> In Range</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Out of Range</div>
                </div>
            </div>

            <div className="relative w-full h-[60vh] bg-gray-200 dark:bg-gray-700/50 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                {/* Department Employee List Modal/Panel */}
                {viewingDepartment && (
                    <div 
                        className="absolute top-0 left-0 bottom-0 w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-20 shadow-lg border-r border-gray-200 dark:border-gray-700 animate-fade-in-down"
                        style={{animationDuration: '0.3s'}}
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <button onClick={() => setViewingDepartment(null)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X className="h-5 w-5"/></button>
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><UsersGroup className="h-5 w-5 text-green-500"/> Present Employees</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{viewingDepartment.name}</p>
                        </div>
                        <div className="p-2 space-y-2 overflow-y-auto h-[calc(100%-65px)]">
                            {presentEmployeesInDept.length > 0 ? (
                                presentEmployeesInDept.map(emp => (
                                    <div key={emp.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                        {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover"/> : <UserCircle className="w-10 h-10 text-gray-400"/>}
                                        <div>
                                            <p className="font-semibold text-sm">{emp.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3"/> Last Scan: {emp.lastScanTime}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 pt-8">No employees currently checked-in at this location.</p>
                            )}
                        </div>
                    </div>
                )}


                {filteredDepartments.map(dept => (
                    <div 
                        key={dept.name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={getPosition(dept.location.latitude, dept.location.longitude)}
                        onClick={() => setViewingDepartment(dept)}
                    >
                        <Building className="h-8 w-8 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-125" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {dept.name}
                        </span>
                    </div>
                ))}

                {employeeLocations.map(emp => (
                    <div
                        key={emp.employeeId}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                        style={getPosition(emp.location.latitude, emp.location.longitude)}
                        onMouseEnter={() => setActiveTooltip(emp)}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                        <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-lg ${emp.isOutOfRange ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                ))}
                
                {activeTooltip && (
                     <div
                        className="absolute p-3 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border dark:border-gray-700 w-64 transform -translate-x-1/2 -translate-y-full -mt-3 transition-opacity animate-fade-in-down z-30"
                        style={{ ...getPosition(activeTooltip.location.latitude, activeTooltip.location.longitude), pointerEvents: 'none' }}
                    >
                       <div className="flex items-center gap-3">
                           <UserCircle className="h-10 w-10 text-gray-400 flex-shrink-0"/>
                           <div>
                               <p className="font-bold text-gray-900 dark:text-white">{activeTooltip.employeeName}</p>
                               <p className="text-xs text-gray-500 dark:text-gray-400">Last Scan: {activeTooltip.lastScanType} at {activeTooltip.lastScanTime}</p>
                               {activeTooltip.isOutOfRange && (
                                   <p className="mt-1 text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Out of Range</p>
                               )}
                           </div>
                       </div>
                    </div>
                )}
            </div>
             {employeeLocations.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">No employee scans with location data for today yet.</p>
            )}
        </div>
    );
};

export default EmployeeMap;
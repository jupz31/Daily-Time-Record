
import React, { useState, useMemo } from 'react';
import { Key, UserCircle, Eye, EyeSlash, Building, Search } from './icons';
import { talisayanSealBase64, catLogoBase64 } from './assets';
import { Department, EmployeeInfo } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
  onEmployeeLogin: (employeeId: string) => boolean;
  employees: EmployeeInfo[];
  departments: Department[];
  onFileLeaveClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onEmployeeLogin, employees, departments, onFileLeaveClick }) => {
  // states for privileged login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // state for login mode
  const [loginMode, setLoginMode] = useState<'privileged' | 'employee'>('privileged');
  
  // states for employee login
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // shared error state
  const [error, setError] = useState('');

  const handlePrivilegedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };
  
  const eligibleEmployees = useMemo(() => {
    if (!selectedDepartment) return [];
    return employees
        .filter(emp => emp.role === 'User' && emp.department === selectedDepartment)
        .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.id.includes(searchQuery))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, selectedDepartment, searchQuery]);

  const handleEmployeeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!selectedEmployeeId) {
          setError('Please select your name from the list.');
          return;
      }
      const success = onEmployeeLogin(selectedEmployeeId);
      if (!success) {
          setError('Login failed. Please contact your administrator.');
      }
  };

  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-1/2 py-3 text-sm font-medium text-center border-b-2 transition-colors
            ${active 
                ? 'text-green-600 dark:text-green-400 border-green-500' 
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
    >
        {children}
    </button>
  );

  const inputStyle = "appearance-none block w-full px-3 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-50 dark:bg-gray-700";


  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-green-900">
        {/* Background elements */}
        <div 
            className="absolute inset-0 z-0"
            style={{
                backgroundImage: `url(${talisayanSealBase64})`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
            }}
        ></div>
        <div className="absolute inset-0 z-0 bg-green-900/85 backdrop-blur-sm"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down">
         <div className="flex justify-center items-center gap-4">
            <div className="p-2 bg-white rounded-full shadow-lg">
              <img src={talisayanSealBase64} alt="Municipality of Talisayan Seal" className="h-40 w-40 object-contain" />
            </div>
            <div className="p-2 bg-white rounded-full shadow-lg">
              <img src={catLogoBase64} alt="Mayor's Office Logo" className="h-40 w-40 object-contain" />
            </div>
         </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          DTR and HRIS System
        </h2>
         <p className="mt-2 text-center text-sm text-green-200">
            Municipality of Talisayan
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-down" style={{animationDelay: '150ms'}}>
        <div className="bg-white dark:bg-gray-800 shadow-2xl sm:rounded-2xl border-t-4 border-green-500 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <TabButton active={loginMode === 'privileged'} onClick={() => { setLoginMode('privileged'); setError(''); }}>
                    Admin / Head / IT
                </TabButton>
                <TabButton active={loginMode === 'employee'} onClick={() => { setLoginMode('employee'); setError(''); setSelectedEmployeeId(''); }}>
                    Employee
                </TabButton>
            </div>
            
            <div className="py-8 px-4 sm:px-10">
                {loginMode === 'privileged' ? (
                    <form className="space-y-6" onSubmit={handlePrivilegedSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCircle className="h-5 w-5 text-gray-400" /></div>
                                <input id="username" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key className="h-5 w-5 text-gray-400" /></div>
                                <input id="password" name="password" type={isPasswordVisible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputStyle} pr-10`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="text-gray-400 hover:text-gray-500" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>{isPasswordVisible ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2"><button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform hover:scale-105">Sign in</button></div>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleEmployeeSubmit}>
                         <div>
                            <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Select your Department</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building className="h-5 w-5 text-gray-400" /></div>
                                <select id="department-select" value={selectedDepartment} onChange={(e) => { setSelectedDepartment(e.target.value); setSelectedEmployeeId(''); }} className={inputStyle} required>
                                    <option value="">-- Select Department --</option>
                                    {departments.map(dept => <option key={dept.name} value={dept.name}>{dept.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {selectedDepartment && (
                            <>
                                <div>
                                    <label htmlFor="employee-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">2. Find and select your Name</label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                                        <input id="employee-search" type="text" placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                                    {eligibleEmployees.length > 0 ? (
                                        eligibleEmployees.map(emp => (
                                            <div key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedEmployeeId === emp.id ? 'bg-green-100 dark:bg-green-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0">
                                                    {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover rounded-full"/> : <UserCircle className="w-full h-full text-gray-400"/>}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${selectedEmployeeId === emp.id ? 'text-green-800 dark:text-white' : ''}`}>{emp.name}</p>
                                                    <p className={`text-xs ${selectedEmployeeId === emp.id ? 'text-green-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>ID: {emp.id}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : ( <p className="text-center text-sm text-gray-500 py-4">No employees found.</p> )}
                                </div>
                            </>
                        )}
                        <div className="pt-2"><button type="submit" disabled={!selectedEmployeeId} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">Sign In</button></div>
                    </form>
                )}

                {error && (<p className="text-sm text-center text-red-500 animate-fade-in-down pt-4">{error}</p>)}

                <div className="mt-6">
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span></div></div>
                    <div className="mt-6"><button type="button" onClick={onFileLeaveClick} className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">File an Application for Leave</button></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { Department, EmployeeInfo, DailyTimeRecord, LeaveRecord, Project, Task, AppNotification, LeaveDetails } from './types';
import {
    talisayanSealBase64,
    avatarFemale1, avatarFemale2, avatarFemale3,
    avatarMale1, avatarMale2, avatarMale3, avatarMale4, avatarAdmin,
    deptIconAdmin, deptIconEng, deptIconHR, deptIconFinance
} from './components/assets';


export const initialDepartments: Department[] = [
    { name: 'Admin Office', onTravel: false, photoUrl: deptIconAdmin, location: { latitude: 8.5733, longitude: 124.7811 }, campus: 'Main Campus' },
    { name: 'Engineering', onTravel: false, photoUrl: deptIconEng, location: { latitude: 8.5735, longitude: 124.7813 }, campus: 'Main Campus' },
    { name: 'Human Resources', onTravel: true, photoUrl: deptIconHR, location: { latitude: 8.6010, longitude: 124.7920 }, campus: 'Downtown Annex' },
    { name: 'Finance', onTravel: false, photoUrl: deptIconFinance, location: { latitude: 8.5730, longitude: 124.7810 }, campus: 'Main Campus' },
];

export const initialEmployees: EmployeeInfo[] = [
    { id: '1001', name: 'Alice Johnson', department: 'Admin Office', employeeType: 'Permanent', positionTitle: 'Office Manager', username: 'alice', password: 'password', leaveBalance: 15, photoUrl: avatarFemale1, role: 'Manager' },
    { id: '1002', name: 'Bob Williams', department: 'Admin Office', employeeType: 'Permanent', positionTitle: 'Admin Assistant', username: 'bob', password: 'password', leaveBalance: 12, photoUrl: avatarMale1, role: 'User' },
    { id: '2001', name: 'Charlie Brown', department: 'Engineering', employeeType: 'Permanent', positionTitle: 'Lead Engineer', username: 'charlie', password: 'password', leaveBalance: 15, photoUrl: avatarMale2, role: 'Manager' },
    { id: '2002', name: 'Diana Miller', department: 'Engineering', employeeType: 'Permanent', positionTitle: 'Software Engineer', username: 'diana', password: 'password', leaveBalance: 10, photoUrl: avatarFemale2, role: 'User' },
    { id: '2003', name: 'Ethan Davis', department: 'Engineering', employeeType: 'Casual', positionTitle: 'Junior Engineer', username: 'ethan', password: 'password', leaveBalance: 5, photoUrl: avatarMale3, role: 'User' },
    { id: '3001', name: 'Fiona Garcia', department: 'Human Resources', employeeType: 'Permanent', positionTitle: 'HR Director', username: 'fiona', password: 'password', leaveBalance: 20, photoUrl: avatarFemale3, role: 'Manager' },
    { id: '3002', name: 'George Rodriguez', department: 'Human Resources', employeeType: 'Job Order', leaveBalance: 0, photoUrl: avatarMale4, role: 'User' },
    { id: '4001', name: 'Hannah Martinez', department: 'Finance', employeeType: 'Permanent', positionTitle: 'Accountant', username: 'hannah', password: 'password', leaveBalance: 13, photoUrl: avatarFemale1, role: 'User' },
    { id: 'admin', name: 'Super Admin', department: 'Admin Office', employeeType: 'Permanent', positionTitle: 'System Admin', username: 'admin', password: 'admin123', leaveBalance: 99, photoUrl: avatarAdmin, role: 'Admin' },
];

export const initialDailyRecords: DailyTimeRecord[] = [
    // Alice Johnson - Admin Office
    { id: '1001-2023-10-26', employeeId: '1001', employeeName: 'Alice Johnson', department: 'Admin Office', date: '2023-10-26', timeIn: '2023-10-26T07:58:00Z', breakOut: '2023-10-26T12:01:00Z', breakIn: '2023-10-26T12:59:00Z', timeOut: '2023-10-26T17:05:00Z' },
    // Charlie Brown - Engineering (late)
    { id: '2001-2023-10-26', employeeId: '2001', employeeName: 'Charlie Brown', department: 'Engineering', date: '2023-10-26', timeIn: '2023-10-26T08:15:00Z', breakOut: '2023-10-26T12:05:00Z', breakIn: '2023-10-26T13:10:00Z', timeOut: '2023-10-26T17:15:00Z' },
    // Diana Miller - Engineering (in progress)
    { id: '2002-2023-10-27', employeeId: '2002', employeeName: 'Diana Miller', department: 'Engineering', date: '2023-10-27', timeIn: '2023-10-27T08:00:00Z', breakOut: null, breakIn: null, timeOut: null },
];


const createInitialDetails = (emp: EmployeeInfo): LeaveDetails => ({
    officeDepartment: emp.department,
    nameLast: emp.name.split(' ').slice(1).join(' ') || '',
    nameFirst: emp.name.split(' ')[0] || '',
    nameMiddle: '',
    dateOfFiling: new Date().toISOString().split('T')[0],
    position: emp.positionTitle || emp.employeeType,
    salary: '',
    leaveType: { vacation: false, mandatoryForced: false, sick: false, maternity: false, paternity: false, specialPrivilege: false, soloParent: false, study: false, vawc: false, rehabilitation: false, specialLeaveWomen: false, specialEmergency: false, adoption: false, others: '' },
    numWorkingDays: '',
    inclusiveDates: '',
    commutation: 'Not Requested',
});

const bobWilliams = initialEmployees.find(e => e.id === '1002')!;
const dianaMiller = initialEmployees.find(e => e.id === '2002')!;
const hannahMartinez = initialEmployees.find(e => e.id === '4001')!;

export const initialLeaveRecords: LeaveRecord[] = [
    { 
        id: 'leave-1', 
        employeeId: '1002', 
        employeeName: 'Bob Williams', 
        department: 'Admin Office', 
        startDate: '2023-11-01', 
        endDate: '2023-11-02', 
        primaryLeaveType: 'Vacation', 
        status: 'Approved', 
        details: {
            ...createInitialDetails(bobWilliams),
            dateOfFiling: '2023-10-20',
            leaveType: { ...createInitialDetails(bobWilliams).leaveType, vacation: true },
            vacationLocation: 'withinPhilippines',
            numWorkingDays: '2',
            inclusiveDates: '2023-11-01 to 2023-11-02'
        } 
    },
    { 
        id: 'leave-2', 
        employeeId: '2002', 
        employeeName: 'Diana Miller', 
        department: 'Engineering', 
        startDate: '2023-11-05', 
        endDate: '2023-11-05', 
        primaryLeaveType: 'Sick', 
        status: 'Pending', 
        details: {
            ...createInitialDetails(dianaMiller),
            dateOfFiling: '2023-10-25',
            leaveType: { ...createInitialDetails(dianaMiller).leaveType, sick: true },
            sickLocation: 'outPatient',
            sickLocationSpecify: 'Fever',
            numWorkingDays: '1',
            inclusiveDates: '2023-11-05'
        } 
    },
    { 
        id: 'leave-3', 
        employeeId: '4001', 
        employeeName: 'Hannah Martinez', 
        department: 'Finance', 
        startDate: '2023-10-30', 
        endDate: '2023-10-30', 
        primaryLeaveType: 'Special Privilege', 
        status: 'Rejected', 
        details: {
            ...createInitialDetails(hannahMartinez),
            dateOfFiling: '2023-10-22',
            leaveType: { ...createInitialDetails(hannahMartinez).leaveType, specialPrivilege: true },
            numWorkingDays: '1',
            inclusiveDates: '2023-10-30'
        } 
    },
];

export const initialProjects: Project[] = [
    { id: 'proj-1', name: 'Q4 Financial Report', description: 'Compile and finalize the financial reports for the fourth quarter.' },
    { id: 'proj-2', name: 'Website Redesign', description: 'Complete overhaul of the company website UI/UX.' },
];

export const initialTasks: Task[] = [
    { id: 'task-1', projectId: 'proj-1', title: 'Gather Expense Reports', description: 'Collect all expense reports from department heads.', assigneeId: '4001', dueDate: '2023-11-10', status: 'In Progress', progress: 50 },
    { id: 'task-2', projectId: 'proj-1', title: 'Draft P&L Statement', description: 'Create the initial draft of the Profit and Loss statement.', assigneeId: '4001', dueDate: '2023-11-15', status: 'To Do', progress: 0 },
    { id: 'task-3', projectId: 'proj-2', title: 'Design Mockups', description: 'Create high-fidelity mockups in Figma.', assigneeId: '2002', dueDate: '2023-11-08', status: 'Done', progress: 100 },
    { id: 'task-4', projectId: 'proj-2', title: 'Develop Homepage', description: 'Code the new homepage based on the approved mockups.', assigneeId: '2003', dueDate: '2023-11-20', status: 'To Do', progress: 0 },
];

export const initialNotifications: AppNotification[] = [
    { id: 'notif-1', recipientId: 'admin', message: 'Charlie Brown filed a Vacation Leave.', read: false, createdAt: '2023-10-26T10:00:00Z' },
    { id: 'notif-2', recipientId: '2001', message: 'Your leave request for Nov 10 has been approved.', read: true, createdAt: '2023-10-25T11:00:00Z' },
];
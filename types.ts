// FIX: Removed self-import of 'UserRole' that was causing a conflict with the local declaration.
export type UserRole = 'admin' | 'it' | 'head' | 'employee';

export interface User {
    username: string;
    role: UserRole;
    department?: string;
    employeeId?: string;
}

export type EmployeeType = 'Permanent' | 'Casual' | 'Job Order';

export type EmployeeRole = 'User' | 'Manager' | 'Admin';

export interface EmployeeInfo {
    id: string;
    name: string;
    department: string;
    employeeType: EmployeeType;
    positionTitle?: string;
    username?: string;
    password?: string;
    leaveBalance: number;
    photoUrl?: string;
    role: EmployeeRole;
}

export interface Department {
    name: string;
    onTravel: boolean;
    photoUrl?: string;
    location: {
        latitude: number;
        longitude: number;
    };
    campus: string;
}

export interface DailyTimeRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    date: string; // YYYY-MM-DD
    timeIn: string | null; // ISO string
    breakOut: string | null; // ISO string
    breakIn: string | null; // ISO string
    timeOut: string | null; // ISO string
    onDuty?: boolean;
    scanLocation?: {
        latitude: number;
        longitude: number;
    };
    isOutOfRange?: boolean;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveDetails {
    // Section 1-5
    officeDepartment: string;
    nameLast: string;
    nameFirst: string;
    nameMiddle: string;
    dateOfFiling: string;
    position: string;
    salary: string;

    // 6.A TYPE OF LEAVE
    leaveType: {
        vacation: boolean;
        mandatoryForced: boolean;
        sick: boolean;
        maternity: boolean;
        paternity: boolean;
        specialPrivilege: boolean;
        soloParent: boolean;
        study: boolean;
        vawc: boolean;
        rehabilitation: boolean;
        specialLeaveWomen: boolean;
        specialEmergency: boolean;
        adoption: boolean;
        others: string;
    };
    
    // 6.B DETAILS OF LEAVE
    vacationLocation?: 'withinPhilippines' | 'abroad';
    vacationLocationSpecify?: string;
    sickLocation?: 'inHospital' | 'outPatient';
    sickLocationSpecify?: string;
    specialLeaveWomenSpecify?: string;
    studyLeaveMasters?: boolean;
    studyLeaveBarBoard?: boolean;
    otherPurposeMonetization?: boolean;
    otherPurposeTerminal?: boolean;

    // 6.C NUMBER OF WORKING DAYS
    numWorkingDays: string;
    inclusiveDates: string;

    // 6.D COMMUTATION
    commutation: 'Not Requested' | 'Requested';
}


export interface LeaveRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    primaryLeaveType: string;
    status: LeaveStatus;
    details: LeaveDetails;
}

export interface Project {
    id: string;
    name: string;
    description: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    assigneeId: string | null;
    dueDate: string; // YYYY-MM-DD
    status: TaskStatus;
    progress: number;
}

export interface AppNotification {
    id: string;
    recipientId: string;
    message: string;
    read: boolean;
    createdAt: string; // ISO string
}
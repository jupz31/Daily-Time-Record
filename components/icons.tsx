import React from 'react';
import { UserRole } from '../types';

const Icon: React.FC<React.SVGProps<SVGSVGElement>> = ({ children, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {children}
  </svg>
);

export const AlertTriangle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></Icon>
);

export const Bell: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></Icon>
);

export const Briefcase: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25h-13.5a2.25 2.25 0 01-2.25-2.25V14.15M16.5 21v-4.098a2.25 2.25 0 00-2.25-2.25h-3.75a2.25 2.25 0 00-2.25 2.25V21M16.5 7.5l-3.75-3.75M8.25 7.5l3.75 3.75m0 0l3.75-3.75M12 11.25V3" /></Icon>
);

export const Building: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></Icon>
);

export const Calendar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h29.25" /></Icon>
);

export const CalendarDays: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h29.25" /></Icon>
);

export const CalendarOff: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h29.25" /></Icon>
);

export const Camera: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></Icon>
);

export const Check: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></Icon>
);

export const CheckCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const ChevronDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></Icon>
);

export const ChevronLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></Icon>
);

export const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></Icon>
);

export const ChevronUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></Icon>
);

export const ChevronUpDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></Icon>
);

export const ClipboardList: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>
);

export const Clock: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const Crosshair: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12h-4m-6 0H3m9-9v4m0 6v4" /></Icon>
);

export const Database: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v1.5a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 7.5V6zM3.75 14.25A2.25 2.25 0 016 12h12a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-1.5z" /></Icon>
);

export const Download: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></Icon>
);

export const Edit: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></Icon>
);

export const Eye: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>
);

export const EyeSlash: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.572M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20" /></Icon>
);

export const FileDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></Icon>
);

export const FileText: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></Icon>
);

export const Home: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></Icon>
);

export const Key: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></Icon>
);

export const List: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></Icon>
);

export const LogOut: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></Icon>
);

export const MapPin: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></Icon>
);

export const Moon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></Icon>
);

export const MoreVertical: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></Icon>
);

export const PaperAirplane: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></Icon>
);

export const Plus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></Icon>
);

export const Printer: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9m0 2.25a.75.75 0 000-1.5m0 1.5a.75.75 0 010-1.5m0 0V9m12-3H3.75A2.25 2.25 0 001.5 8.25v12A2.25 2.25 0 003.75 22.5h16.5A2.25 2.25 0 0022.5 20.25V8.25A2.25 2.25 0 0020.25 6H12M15 3.75a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5h-2.25a.75.75 0 01-.75-.75z" /></Icon>
);

export const QrCode: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM3.75 9a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.75 9zm0 5.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM8.25 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM8.25 9a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 018.25 9zm0 5.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12.75 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12.75 9a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM17.25 9a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM17.25 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm2.25 13.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" /></Icon>
);

export const RefreshCw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a8.25 8.25 0 00-11.664 0l-3.181 3.183" /></Icon>
);

export const Search: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></Icon>
);

export const Settings: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.025 1.11-1.226l.052-.022c.51-.226 1.074-.226 1.584 0l.052.022c.55.201 1.02.684 1.11 1.226l.064.392c.287.173.56.38.81.62l.245.244c.42.42.92.744 1.45.922l.37.126c.55.187 1.03.62 1.25 1.13l.04.1c.22.51.22 1.073 0 1.582l-.04.1c-.22.51-.7 1.03-1.25 1.13l-.37.126c-.53.178-1.03.502-1.45.922l-.245.244c-.25.24-.523.447-.81.62l-.064.392c-.09.542-.56 1.025-1.11 1.226l-.052.022c-.51.226-1.074-.226-1.584 0l-.052-.022c-.55-.201-1.02-.684-1.11-1.226l-.064-.392c-.287-.173-.56-.38-.81-.62l-.245-.244a2.25 2.25 0 01-.922-1.45l-.126-.37c-.187-.55-.62-1.03-1.13-1.25l-.1-.04c-.51-.22-.51-1.072 0-1.582l.1-.04c.51-.22 1.03-.7 1.13-1.25l.126-.37c.178-.53.502-1.03.922-1.45l.245-.244c.25-.24.523-.447.81-.62l.064-.392zM12 15a3 3 0 100-6 3 3 0 000 6z" /></Icon>
);

export const ShieldCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m6.33 3.337c.386.386.633.91.633 1.474V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-2.439c0-.564.247-1.088.633-1.474l6-6A1.5 1.5 0 0112 7.5l6 6c.386.386.633.91.633 1.474z" /></Icon>
);

export const Sun: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></Icon>
);

export const Trash: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></Icon>
);

export const UploadCloud: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></Icon>
);

export const UserCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>
);

export const UserPlus: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></Icon>
);

export const Users: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.53-2.475M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.106c3.298-.958 4.752-4.023 4.752-7.472 0-3.448-1.454-6.514-4.752-7.472l-.001-.106A12.318 12.318 0 0110.374 3c2.331 0 4.512.645 6.374 1.766l.001.106c-3.298.958-4.752 4.023-4.752 7.472 0 3.448 1.454 6.514 4.752 7.472z" /></Icon>
);

export const UsersGroup: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.04-2.72a3 3 0 00-4.682 2.72 9.094 9.094 0 003.741.479m7.04-2.72a3 3 0 00-3.742 0m3.742 0a3 3 0 00-3.742 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 15a3 3 0 100-6 3 3 0 000 6z" /></Icon>
);


export const UserShield: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m6.33 3.337c.386.386.633.91.633 1.474V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-2.439c0-.564.247-1.088.633-1.474l6-6A1.5 1.5 0 0112 7.5l6 6c.386.386.633.91.633 1.474z" /></Icon>
);

export const X: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>
);

export const XCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);


interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  icon,
  iconBgClass = 'bg-yellow-100 dark:bg-yellow-900/50',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[70] p-4 animate-fade-in-down" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          {icon && (
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${iconBgClass}`}>
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RoleDisplayBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleStyles: Record<UserRole, string> = {
        'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'it': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        'head': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'employee': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    const roleNameMap: Record<UserRole, string> = {
        'admin': 'Administrator',
        'it': 'IT Support',
        'head': 'Department Head',
        'employee': 'Employee'
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${roleStyles[role]}`}>
            {roleNameMap[role]}
        </span>
    );
};
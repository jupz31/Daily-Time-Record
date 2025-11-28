import React, { useState, useMemo } from 'react';
import { Project, Task, EmployeeInfo, TaskStatus } from '../types';
import { Briefcase, Plus, Edit, Trash, X, CalendarDays, UserCircle } from './icons';

interface ProjectManagerProps {
    projects: Project[];
    tasks: Task[];
    employees: EmployeeInfo[];
    projectActions: {
        add: (project: Project) => void;
        update: (project: Project) => void;
        delete: (projectId: string) => void;
    };
    taskActions: {
        add: (task: Task) => void;
        update: (task: Task) => void;
        delete: (taskId: string) => void;
    };
}

const today = new Date().toISOString().split('T')[0];
const taskStatuses: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
    const statusMap = {
        'To Do': "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
        'In Progress': "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        'Done': "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block ${statusMap[status]}`}>{status}</span>;
};

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, tasks, employees, projectActions, taskActions }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

    // Modals and Forms State
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectFormData, setProjectFormData] = useState({ name: '', description: '' });

    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '', description: '', assigneeId: null as string | null, dueDate: today, status: 'To Do' as TaskStatus, progress: 0
    });
    
    // Filters State
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

    const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value });
    };
    
    const openProjectModal = (project: Project | null) => {
        setEditingProject(project);
        setProjectFormData(project ? { name: project.name, description: project.description } : { name: '', description: '' });
        setProjectModalOpen(true);
    };

    const handleProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectFormData.name) return;
        if (editingProject) {
            projectActions.update({ ...editingProject, ...projectFormData });
        } else {
            projectActions.add({ id: `proj-${Date.now()}`, ...projectFormData });
        }
        setProjectModalOpen(false);
    };

    const handleTaskFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newStatus = taskFormData.status;
        let newProgress = taskFormData.progress;

        if (name === 'progress') {
            newProgress = Number(value);
            if (newProgress === 0) newStatus = 'To Do';
            else if (newProgress === 100) newStatus = 'Done';
            else newStatus = 'In Progress';
        } else if (name === 'status') {
            newStatus = value as TaskStatus;
            if (newStatus === 'To Do') newProgress = 0;
            else if (newStatus === 'Done') newProgress = 100;
            else if (newProgress === 0 || newProgress === 100) newProgress = 50; // Set to 50 if moving from extremes
        }

        setTaskFormData(prev => ({ ...prev, [name]: value, status: newStatus, progress: newProgress }));
    };

    const openTaskModal = (task: Task | null) => {
        setEditingTask(task);
        setTaskFormData(task ? {
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId,
            dueDate: task.dueDate,
            status: task.status,
            progress: task.progress
        } : { title: '', description: '', assigneeId: null, dueDate: today, status: 'To Do', progress: 0 });
        setTaskModalOpen(true);
    };
    
    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.title || !selectedProjectId) return;
        if (editingTask) {
            taskActions.update({ ...editingTask, ...taskFormData });
        } else {
            taskActions.add({ id: `task-${Date.now()}`, projectId: selectedProjectId, ...taskFormData });
        }
        setTaskModalOpen(false);
    };

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => task.projectId === selectedProjectId)
            .filter(task => statusFilter === 'All' || task.status === statusFilter)
            .filter(task => assigneeFilter === 'All' || task.assigneeId === assigneeFilter)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [tasks, selectedProjectId, statusFilter, assigneeFilter]);
    
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

    const renderModals = () => (
        <>
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={() => setProjectModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold">{editingProject ? 'Edit Project' : 'Add Project'}</h3>
                            <button onClick={() => setProjectModalOpen(false)}><X className="h-5 w-5"/></button>
                        </div>
                        <form onSubmit={handleProjectSubmit} className="p-4 space-y-4">
                            <div><label>Project Name</label><input type="text" name="name" value={projectFormData.name} onChange={handleProjectFormChange} className={inputStyle} required /></div>
                            <div><label>Description</label><textarea name="description" value={projectFormData.description} onChange={handleProjectFormChange} className={inputStyle} rows={3}></textarea></div>
                            <div className="flex justify-end gap-2"><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">{editingProject ? 'Save' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
             {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4" onClick={() => setTaskModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h3 className="text-lg font-semibold">{editingTask ? 'Edit Task' : 'Add Task'}</h3><button onClick={() => setTaskModalOpen(false)}><X className="h-5 w-5"/></button></div>
                        <form onSubmit={handleTaskSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div><label>Title</label><input type="text" name="title" value={taskFormData.title} onChange={handleTaskFormChange} className={inputStyle} required /></div>
                            <div><label>Description</label><textarea name="description" value={taskFormData.description} onChange={handleTaskFormChange} className={inputStyle} rows={2}></textarea></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label>Assignee</label><select name="assigneeId" value={taskFormData.assigneeId || ''} onChange={handleTaskFormChange} className={inputStyle}><option value="">Unassigned</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                                <div><label>Due Date</label><input type="date" name="dueDate" value={taskFormData.dueDate} onChange={handleTaskFormChange} className={inputStyle} /></div>
                            </div>
                            <div><label>Status</label><select name="status" value={taskFormData.status} onChange={handleTaskFormChange} className={inputStyle}>{taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label>Progress: {taskFormData.progress}%</label><input type="range" name="progress" min="0" max="100" value={taskFormData.progress} onChange={handleTaskFormChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div>
                            <div className="flex justify-end gap-2"><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">{editingTask ? 'Save Changes' : 'Add Task'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-6">
            {renderModals()}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-5 w-5"/> Projects &amp; Tasks</h3>
                <div className="flex items-center gap-2">
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className={inputStyle + ' w-48'}>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={() => openProjectModal(null)} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><Plus className="h-5 w-5"/></button>
                    {selectedProjectId && (
                        <>
                            <button onClick={() => openProjectModal(projects.find(p=>p.id === selectedProjectId) || null)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"><Edit className="h-5 w-5"/></button>
                            <button onClick={() => projectActions.delete(selectedProjectId)} className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-md hover:bg-red-200 dark:hover:bg-red-900"><Trash className="h-5 w-5"/></button>
                        </>
                    )}
                </div>
            </div>
            
            {selectedProjectId ? (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-semibold">{projects.find(p=>p.id === selectedProjectId)?.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{projects.find(p=>p.id === selectedProjectId)?.description}</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Status:</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={inputStyle + ' text-sm'}>
                                <option value="All">All</option>{taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <label className="text-sm font-medium">Assignee:</label>
                            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className={inputStyle + ' text-sm'}>
                                <option value="All">All</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <button onClick={() => openTaskModal(null)} className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"><Plus className="h-4 w-4"/> Add Task</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTasks.map(task => {
                            const assignee = employees.find(e => e.id === task.assigneeId);
                            return (
                                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-bold text-gray-800 dark:text-gray-100">{task.title}</h5>
                                        <div className="flex gap-1"><button onClick={()=>openTaskModal(task)} className="p-1"><Edit className="h-4 w-4 text-gray-500 hover:text-blue-500"/></button><button onClick={()=>taskActions.delete(task.id)} className="p-1"><Trash className="h-4 w-4 text-gray-500 hover:text-red-500"/></button></div>
                                    </div>
                                    {task.description && <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>}
                                    <div>
                                        <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-green-700 dark:text-green-400">Progress</span><span className="text-xs font-medium text-green-700 dark:text-green-400">{task.progress}%</span></div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700"><div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div></div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-2 border-t dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                            {assignee?.photoUrl ? <img src={assignee.photoUrl} alt={assignee.name} className="w-6 h-6 rounded-full"/> : <UserCircle className="w-6 h-6 text-gray-400"/>}
                                            <span className="text-gray-700 dark:text-gray-300">{assignee?.name || 'Unassigned'}</span>
                                        </div>
                                        <StatusBadge status={task.status}/>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                        <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/><span>Due: {task.dueDate}</span></div>
                                        {task.dueDate < today && task.status !== 'Done' && <span className="font-semibold text-red-500">OVERDUE</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     {filteredTasks.length === 0 && <p className="text-center text-gray-500 py-8">No tasks match the current filters.</p>}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">No projects found. Please add a project to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;

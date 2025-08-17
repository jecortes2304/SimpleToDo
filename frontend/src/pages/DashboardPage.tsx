import {useTranslation} from 'react-i18next';
import React, {useCallback, useEffect, useState} from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {getUserProjects} from '../services/ProjectService';
import {Pagination} from '../schemas/globals';
import {Project} from '../schemas/projects';
import {Task} from '../schemas/tasks';
import {ProjectData, Status, TaskStatusData} from '../schemas/dashboard';

const STATUS_COLORS: Record<Status, string> = {
    ongoing: '#60A5FA',
    cancelled: '#FBBF24',
    completed: '#34D399',
    blocked: '#F87171',
    pending: '#4975e6'
};

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projectDataArray, setProjectDataArray] = useState<ProjectData[]>([]);
    const [taskStatusDataArray, setTaskStatusDataArray] = useState<TaskStatusData[]>([]);

    const getStatusById = (id: number): Status => {
        switch (id) {
            case 1: return 'pending';
            case 2: return 'ongoing';
            case 3: return 'completed';
            case 4: return 'blocked';
            case 5: return 'cancelled';
            default: return 'pending';
        }
    };

    const formatStatus = (status: Status) => {
        const translated = t(`tasks.status.${status}`);
        return translated.charAt(0).toUpperCase() + translated.slice(1);
    };

    const fetchProjects = useCallback(async () => {
        const response = await getUserProjects(1000, 1, 'asc');
        if (response.ok && response.result) {
            const projectPagination = response.result as Pagination<Project>;
            setProjects(projectPagination.items);
            setTasks(projectPagination.items.flatMap(p => p.tasks));
        }
    }, []);

    useEffect(() => {
        fetchProjects().then();
    }, [fetchProjects]);

    useEffect(() => {
        const projectData = projects.map(p => ({
            name: p.name,
            tasks: p.tasks.length
        }));

        const statusCount: Record<Status, number> = {
            ongoing: 0,
            cancelled: 0,
            completed: 0,
            blocked: 0,
            pending: 0
        };

        tasks.forEach(task => {
            const status = getStatusById(task.statusId);
            statusCount[status] += 1;
        });

        const taskStatusData: TaskStatusData[] = (Object.entries(statusCount) as [Status, number][])
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));

        setProjectDataArray(projectData);
        setTaskStatusDataArray(taskStatusData);
    }, [tasks, projects]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('dashboard.dashboard')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-2">{t('dashboard.tasksByStatus')}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={taskStatusDataArray}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name }) => formatStatus(name as Status)}
                            >
                                {taskStatusDataArray.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={STATUS_COLORS[entry.name as Status]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, formatStatus(name as Status)]} />
                            <Legend formatter={(value) => formatStatus(value as Status)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card bg-base-100 shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-2">{t('dashboard.tasksPerProject')}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={projectDataArray} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tasks" name={t('tasks.tasks')} fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

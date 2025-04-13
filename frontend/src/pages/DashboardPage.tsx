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
import {getUserProjects} from "../services/ProjectService.ts";
import {Pagination} from "../schemas/globals.ts";
import {Project} from "../schemas/projects.ts";
import {Task} from "../schemas/tasks.ts";
import {ProjectData, Status, TaskStatusData} from "../schemas/dashboard.ts";


const COLORS = ['#60A5FA', '#FBBF24', '#34D399', '#F87171', '#A78BFA'];

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [projectDataArray, setProjectDataArray] = useState<ProjectData[]>([])
    const [taskStatusDataArray, setTaskStatusDataArray] = useState<TaskStatusData[]>([])

    const getStatusById = (id: number): Status => {
        switch (id) {
            case 1:
                return 'pending'
            case 2:
                return 'ongoing'
            case 3:
                return 'completed'
            case 4:
                return 'blocked'
            case 5:
                return 'cancelled'
            default:
                return 'pending'
        }
    }

    const formatStatus = (status: string) => {
        const translated = t(`tasks.status.${status}`);
        return translated.charAt(0).toUpperCase() + translated.slice(1);
    };

    const getUserProjectsCallback = useCallback(async () => {
        const response = await getUserProjects(1000, 1, 'asc')
        if (response.ok && response.result) {
            const projectPagination = response.result as Pagination<Project>
            setProjects(projectPagination.items)
            setTasks(projectPagination.items.flatMap((project) => project.tasks))
        } else {
            console.error('Error fetching projects:', response.errors as string);
        }
    }, [])

    useEffect(() => {
        getUserProjectsCallback().then()
    }, []);

    useEffect(() => {
        setProjectDataArray(projects.map((project) => ({
            name: project.name,
            tasks: project.tasks.length,
        })))

        setTaskStatusDataArray(tasks.reduce((acc: TaskStatusData[], task) => {
            const status = getStatusById(task.statusId)
            const existingStatus = acc.find(item => item.name === status)

            if (existingStatus) {
                existingStatus.value += 1
            } else {
                acc.push({ name: status, value: 1 })
            }

            return acc
        }, []))
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
                                label
                            >
                                {taskStatusDataArray.map((value, index) => (
                                    <Cell key={`cell-${index}`} name={formatStatus(getStatusById(value.value))} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card bg-base-100 shadow-md p-4">
                    <h2 className="text-lg font-semibold mb-2">{t('dashboard.tasksPerProject')}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={projectDataArray} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
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

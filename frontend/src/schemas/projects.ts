import {Task} from "./tasks.ts";

export interface Project {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    tasks: Task[];
}

export interface CreateProjectDto {
    name: string;
    description: string;
}

export interface UpdateProjectDto {
    id: number;
    name: string;
    description: string;
}

export type TaskStatus = 'pending' | 'ongoing' | 'completed' | 'blocked' | 'cancelled';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    statusId: number;
    userId: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}

export interface TaskCreateDto {
    title: string,
    description: string
}

export interface TaskUpdateDto {
    title: string,
    description: string,
    status: TaskStatus
}




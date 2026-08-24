export type Status = 'pending' | 'ongoing' | 'completed' | 'blocked' | 'cancelled';

export interface TaskStatusData {
    name: string;
    value: number;
}

export interface ProjectData {
    name: string;
    tasks: number;
}
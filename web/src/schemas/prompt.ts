export interface Prompt {
    id: number;
    title: string;
    description: string;
    systemPrompt: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePromptDto {
    title: string;
    description: string;
    systemPrompt: string;
}

export interface UpdatePromptDto {
    title?: string;
    description?: string;
    systemPrompt?: string;
}
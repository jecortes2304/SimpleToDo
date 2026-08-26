import {Project} from '../../schemas/project.ts';

type TaskProjectFilterProps = {
    projects: readonly Project[];
    value: number;
    disabled?: boolean;
    placeholder: string;
    onChange: (projectId: number) => void;
};

function TaskProjectFilter({
    projects,
    value,
    disabled = false,
    placeholder,
    onChange,
}: TaskProjectFilterProps) {
    return (
        <label className="form-control flex-row items-center gap-2">
            <select
                value={value}
                className="select select-sm select-bordered min-w-44"
                disabled={disabled}
                onChange={event => onChange(Number(event.target.value))}
            >
                <option value={0} disabled>{placeholder}</option>
                {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                ))}
            </select>
        </label>
    );
}

export default TaskProjectFilter;

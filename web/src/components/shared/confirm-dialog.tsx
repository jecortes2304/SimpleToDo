import {ExclamationTriangleIcon} from '@heroicons/react/16/solid';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
};

function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <div className="modal-box max-w-md">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-7 w-7 shrink-0 text-warning"/>
                    <div>
                        <h2 id="confirm-dialog-title" className="text-lg font-bold">{title}</h2>
                        <p className="mt-2 text-base-content/75">{message}</p>
                    </div>
                </div>
                <div className="modal-action">
                    <button type="button" className="btn" disabled={loading} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button type="button" className="btn btn-error" disabled={loading} onClick={onConfirm}>
                        {loading && <span className="loading loading-spinner loading-sm"/>}
                        {confirmLabel}
                    </button>
                </div>
            </div>
            <button type="button" className="modal-backdrop" aria-label={cancelLabel} onClick={onCancel}/>
        </div>
    );
}

export default ConfirmDialog;

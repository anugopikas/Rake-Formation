export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, disabled = false }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card modal-card--compact" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" disabled={disabled} onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger" disabled={disabled} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

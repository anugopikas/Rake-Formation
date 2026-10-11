import { useState } from 'react';
import { apiRequest } from '../../api';
import Modal from './Modal';
import { notify } from '../../utils/toast';

export default function ResourceCreateModal({
  open,
  title,
  endpoint,
  fields,
  onClose,
  onCreated,
  successMessage,
}) {
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function closeModal() {
    if (saving) return;
    setValues({});
    setError('');
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const body = Object.fromEntries(fields.map((field) => {
      const value = values[field.name] ?? field.defaultValue ?? '';
      if (field.type === 'number') return [field.name, Number(value)];
      if (field.type === 'boolean') return [field.name, value === true || value === 'true'];
      return [field.name, value];
    }));

    try {
      const created = await apiRequest(endpoint, { method: 'POST', body });
      onCreated(created);
      notify({ type: 'success', message: successMessage });
      setValues({});
      onClose();
    } catch (requestError) {
      const message = requestError.message || `Unable to create ${title.toLowerCase()}.`;
      setError(message);
      notify({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={closeModal}>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {fields.map((field) => (
            <label key={field.name}>
              <span>{field.label}</span>
              {field.options ? (
                <select
                  required={field.required !== false}
                  value={values[field.name] ?? field.defaultValue ?? ''}
                  onChange={(event) => updateField(field.name, event.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={String(option.value)} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required !== false}
                  type={field.type || 'text'}
                  min={field.type === 'number' ? (field.min ?? 0) : undefined}
                  step={field.type === 'number' ? (field.step ?? 'any') : undefined}
                  value={values[field.name] ?? field.defaultValue ?? ''}
                  onChange={(event) => updateField(field.name, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" disabled={saving} onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

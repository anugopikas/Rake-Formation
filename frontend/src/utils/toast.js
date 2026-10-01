export function notify({ type = 'info', message }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('rake-toast', { detail: { type, message } }));
}

import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const { type = 'info', message } = event.detail || {};
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, type, message }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 3200);
    };

    window.addEventListener('rake-toast', handler);
    return () => window.removeEventListener('rake-toast', handler);
  }, []);

  if (!items.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.type}`}>
          <strong>{item.type.toUpperCase()}</strong>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

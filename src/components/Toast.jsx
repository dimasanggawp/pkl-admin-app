import { useEffect, useState } from 'react';

const TOAST_STYLES = {
  success: 'border-success/30 text-success before:bg-success',
  error: 'border-danger/30 text-danger before:bg-danger',
  info: 'border-border text-ink before:bg-accent',
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const { message, type, id } = event.detail;
      setToasts((prev) => [...prev, { message, type, id }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`relative overflow-hidden rounded-xl border bg-surface pl-4 pr-4 py-3 shadow-lift font-medium text-sm text-ink before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${
            TOAST_STYLES[toast.type] || TOAST_STYLES.info
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

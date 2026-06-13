import { useEffect, useState } from 'react';

const TOAST_STYLES = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
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
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-white shadow-lg ${
            TOAST_STYLES[toast.type] || TOAST_STYLES.info
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

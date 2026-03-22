import { useEffect } from 'react';
import { useErrorStore } from '../../store/errorStore';

export default function ErrorToast() {
  const { message, clear } = useErrorStore();

  // Auto-dismiss after 5 s
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 5000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div className="error-toast" role="alert">
      <span className="error-toast-msg">{message}</span>
      <button className="error-toast-close" onClick={clear} aria-label="Dismiss">✕</button>
    </div>
  );
}

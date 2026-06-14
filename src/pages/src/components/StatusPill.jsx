import { useState, useEffect } from 'react';
import { checkHealth } from '../lib/api';

export default function StatusPill() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      const ok = await checkHealth();
      if (!cancelled) setStatus(ok ? 'online' : 'offline');
    }

    ping();

    // Re-ping every 30 s
    const id = setInterval(ping, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const label =
    status === 'checking' ? 'Checking...' :
    status === 'online'   ? 'Model online' :
    'API unreachable';

  return (
    <span className={`status-pill ${status}`} title={`API base: ${import.meta.env.VITE_SENTIMENT_API_URL ?? 'localhost:8000'}`}>
      <span className={`status-dot ${status}`} />
      {label}
    </span>
  );
}

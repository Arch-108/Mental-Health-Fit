// Placeholder for the Rural/Adaptive Mode indicator described in the
// research doc (Step 6, feature #1). It always tells the user WHAT mode
// they're in and WHY - never a silent degradation. Wired to real
// network-quality detection in the Consultation sprint; for now it reflects
// the browser's Network Information API where available, falling back to
// "Standard".
import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [mode, setMode] = useState('Standard');

  useEffect(() => {
    const conn = navigator.connection || navigator.webkitConnection;
    if (!conn) return;
    const update = () => {
      const t = conn.effectiveType;
      if (t === 'slow-2g' || t === '2g') setMode('Text-only');
      else if (t === '3g') setMode('Audio-friendly');
      else setMode('Standard');
    };
    update();
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return (
    <span style={styles.pill} title="Forever Fit adapts consultations to your connection automatically">
      <span style={styles.dot} /> {mode} mode
    </span>
  );
}

const styles = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: '#1B3A63',
    background: '#FBEFD7',
    border: '1px solid #F0D9A0',
    borderRadius: 999,
    padding: '0.35rem 0.8rem',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#2E7D5B',
    display: 'inline-block',
  },
};

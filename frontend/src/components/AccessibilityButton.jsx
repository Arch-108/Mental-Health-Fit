import { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { IconAccessibility, IconClose } from './Icons';

export default function AccessibilityButton() {
  const { settings, update, reset } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
      {open && (
        <div className="card" style={styles.panel} role="dialog" aria-label="Accessibility settings">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ margin: 0 }}>Accessibility</h3>
            <button className="btn" style={{ background: 'transparent', color: 'var(--color-text-muted)' }} onClick={() => setOpen(false)} aria-label="Close"><IconClose size={16} /></button>
          </div>

          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Text size</legend>
            {[
              { id: 'normal', label: 'Default' },
              { id: 'large', label: 'Large' },
              { id: 'xlarge', label: 'Extra large' },
            ].map((opt) => (
              <label key={opt.id} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="fontSize"
                  checked={settings.fontSize === opt.id}
                  onChange={() => update({ fontSize: opt.id })}
                  style={{ width: 'auto' }}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Color mode</legend>
            {[
              { id: 'standard', label: 'Standard' },
              { id: 'colorblind-friendly', label: 'Colorblind-friendly' },
              { id: 'high-contrast', label: 'High contrast' },
            ].map((opt) => (
              <label key={opt.id} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="colorMode"
                  checked={settings.colorMode === opt.id}
                  onChange={() => update({ colorMode: opt.id })}
                  style={{ width: 'auto' }}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <label style={styles.radioLabel}>
            <input
              type="checkbox"
              checked={settings.dyslexiaFont}
              onChange={(e) => update({ dyslexiaFont: e.target.checked })}
              style={{ width: 'auto' }}
            />
            Dyslexia-friendly font
          </label>

          <button className="btn" style={{ background: '#FBEFD7', color: '#12253F', marginTop: '1rem', width: '100%' }} onClick={reset}>
            Reset to default
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.fab}
        aria-label="Accessibility settings"
        title="Accessibility settings"
      >
        <IconAccessibility size={24} />
      </button>
    </div>
  );
}

const styles = {
  wrapper: { position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50 },
  fab: {
    width: 52, height: 52, borderRadius: '50%', border: 'none',
    background: '#1B3A63', color: 'white', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(23,36,31,0.25)',
  },
  panel: {
    position: 'absolute', bottom: '4rem', right: 0, width: 280,
    boxShadow: '0 8px 28px rgba(23,36,31,0.18)',
  },
  fieldset: { border: 'none', padding: 0, margin: '0 0 1rem' },
  legend: { fontWeight: 600, fontSize: '0.88rem', padding: 0, marginBottom: '0.4rem' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400, marginBottom: '0.35rem', fontSize: '0.9rem' },
};

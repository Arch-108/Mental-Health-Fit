import { useMemo, useState, useEffect } from 'react';
import { IconArrowRight } from './Icons';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Open slots come back as a flat list of ISO datetimes (next 14 days) - this
// groups them by calendar day so a month grid can show which days actually
// have availability, instead of the old flat wall of date+time buttons.
export default function BookingCalendar({ slots, onBook, booking }) {
  const slotsByDay = useMemo(() => {
    const map = {};
    for (const s of slots) {
      const d = new Date(s);
      const key = dateKey(d);
      (map[key] ||= []).push(s);
    }
    Object.values(map).forEach((list) => list.sort());
    return map;
  }, [slots]);

  const firstAvailableKey = Object.keys(slotsByDay).sort()[0];
  const initialMonth = firstAvailableKey ? new Date(firstAvailableKey) : new Date();

  const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(firstAvailableKey || null);

  // If the doctor/slot set changes (new doctor picked), jump back to the
  // first month/day that actually has openings rather than staying on
  // whatever was selected for the previous doctor.
  useEffect(() => {
    const first = Object.keys(slotsByDay).sort()[0];
    setSelectedKey(first || null);
    setViewMonth(first ? new Date(new Date(first).getFullYear(), new Date(first).getMonth(), 1) : new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const todayKey = dateKey(new Date());

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day));
    return out;
  }, [viewMonth]);

  function changeMonth(delta) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const daySlots = selectedKey ? slotsByDay[selectedKey] || [] : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <button type="button" className="btn" style={calStyles.navBtn} onClick={() => changeMonth(-1)} aria-label="Previous month">
          <IconArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <strong style={{ color: 'var(--color-text)' }}>{monthLabel}</strong>
        <button type="button" className="btn" style={calStyles.navBtn} onClick={() => changeMonth(1)} aria-label="Next month">
          <IconArrowRight size={14} />
        </button>
      </div>

      <div style={calStyles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={calStyles.weekdayLabel}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} />;
          const key = dateKey(d);
          const hasSlots = Boolean(slotsByDay[key]?.length);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <button
              type="button"
              key={key}
              disabled={!hasSlots}
              onClick={() => setSelectedKey(key)}
              style={{
                ...calStyles.dayCell,
                ...(hasSlots ? calStyles.dayHasSlots : calStyles.dayEmpty),
                ...(isSelected ? calStyles.daySelected : {}),
                ...(isToday ? calStyles.dayToday : {}),
              }}
              title={hasSlots ? `${slotsByDay[key].length} open slot${slotsByDay[key].length > 1 ? 's' : ''}` : 'No openings'}
            >
              {d.getDate()}
              {hasSlots && <span style={calStyles.dot} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontWeight: 500, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
          {selectedKey
            ? new Date(selectedKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
            : 'Select a highlighted day'}
        </p>
        {selectedKey && daySlots.length === 0 && <p>No open slots on this day.</p>}
        {!selectedKey && <p>No open slots in the next 14 days — this doctor hasn't published availability yet.</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {daySlots.map((s) => (
            <button
              key={s}
              className="btn"
              disabled={booking}
              style={{ background: 'var(--color-accent-tint)', color: 'var(--color-primary-dark)', fontSize: '0.82rem' }}
              onClick={() => onBook(s)}
            >
              {new Date(s).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const calStyles = {
  navBtn: { background: 'var(--color-bg)', padding: '0.3rem 0.6rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' },
  weekdayLabel: { textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, padding: '0.2rem 0' },
  dayCell: {
    position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, fontSize: '0.85rem', border: '1px solid transparent', cursor: 'pointer', background: 'transparent',
  },
  dayHasSlots: { background: 'var(--color-accent-tint)', color: 'var(--color-primary-dark)', fontWeight: 600, cursor: 'pointer' },
  dayEmpty: { color: 'var(--color-text-muted)', opacity: 0.45, cursor: 'default' },
  daySelected: { background: 'var(--color-primary)', color: '#fff' },
  dayToday: { border: '1px solid var(--color-accent)' },
  dot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: 'currentColor' },
};

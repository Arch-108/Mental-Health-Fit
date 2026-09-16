import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { searchFacilities, createVaccinationRoute, listMyVaccinationRoutes, getVaccinationRoute, suggestScheduleOrder } from '../services/api';
import { IconArrowUp, IconArrowDown, IconClose } from '../components/Icons';

export default function VaccinationRoutes() {
  const [facilities, setFacilities] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]); // [{ facilityId, name, address }]
  const [name, setName] = useState('');
  const [coldChainLimitHours, setColdChainLimitHours] = useState(8);
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    searchFacilities({}).then(setFacilities).catch(() => setFacilities([]));
    loadRoutes();
  }, []);

  async function loadRoutes() {
    const data = await listMyVaccinationRoutes().catch(() => []);
    setRoutes(data);
  }

  function addStop(facility) {
    if (selectedStops.some((s) => s.facilityId === facility.id)) return;
    setSelectedStops((s) => [...s, { facilityId: facility.id, name: facility.name, address: facility.address }]);
    setSuggestion(null);
  }

  async function askAiForOrder() {
    setSuggesting(true);
    setSuggestion(null);
    try {
      const result = await suggestScheduleOrder({
        coldChainLimitHours: Number(coldChainLimitHours) || 8,
        stops: selectedStops.map((s) => ({ name: s.name, address: s.address })),
      });
      setSuggestion(result.text);
    } catch {
      setSuggestion("Couldn't get a suggestion right now — you can still reorder stops manually below.");
    } finally {
      setSuggesting(false);
    }
  }

  function removeStop(facilityId) {
    setSelectedStops((s) => s.filter((x) => x.facilityId !== facilityId));
  }

  function moveStop(index, direction) {
    setSelectedStops((s) => {
      const copy = [...s];
      const target = index + direction;
      if (target < 0 || target >= copy.length) return copy;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function saveRoute(e) {
    e.preventDefault();
    setMessage('');
    try {
      await createVaccinationRoute({
        name,
        coldChainLimitHours: Number(coldChainLimitHours),
        stops: selectedStops.map((s) => ({ facilityId: s.facilityId })),
      });
      setMessage('Route saved.');
      setName('');
      setSelectedStops([]);
      loadRoutes();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not save the route.');
    }
  }

  async function viewRoute(id) {
    const data = await getVaccinationRoute(id).catch(() => null);
    setActiveRoute(data);
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/exam-room.jpg"
        title="Vaccination Outreach Planner"
        subtitle="Plan a multi-stop outreach route across existing facilities and check it against your cold-chain time budget."
      />

      <div className="grid-2">
        <div className="card">
          <h3>Build a route</h3>
          <form onSubmit={saveRoute}>
            <label>Route name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: '0.8rem' }} />
            <label>Cold-chain time limit (hours)</label>
            <input type="number" step="0.5" value={coldChainLimitHours} onChange={(e) => setColdChainLimitHours(e.target.value)} style={{ marginBottom: '1rem', maxWidth: 140 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>Selected stops (in order):</p>
              {selectedStops.length > 1 && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--color-accent-tint)', color: 'var(--color-primary-dark)', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                  onClick={askAiForOrder}
                  disabled={suggesting}
                >
                  {suggesting ? 'Thinking…' : 'Ask AI for a suggested order'}
                </button>
              )}
            </div>
            {suggestion && (
              <div className="card" style={{ background: 'var(--color-bg)', fontSize: '0.85rem', margin: '0.6rem 0' }}>
                {suggestion}
              </div>
            )}
            {selectedStops.length === 0 && <p>Add stops from the list on the right.</p>}
            {selectedStops.map((s, i) => (
              <div key={s.facilityId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{i + 1}. {s.name}</span>
                <button type="button" className="btn" aria-label="Move up" style={{ background: 'var(--color-bg)', padding: '0.3rem 0.6rem' }} onClick={() => moveStop(i, -1)}><IconArrowUp size={15} /></button>
                <button type="button" className="btn" aria-label="Move down" style={{ background: 'var(--color-bg)', padding: '0.3rem 0.6rem' }} onClick={() => moveStop(i, 1)}><IconArrowDown size={15} /></button>
                <button type="button" className="btn" aria-label="Remove stop" style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, var(--color-surface))', color: 'var(--color-danger)', padding: '0.3rem 0.6rem' }} onClick={() => removeStop(s.facilityId)}><IconClose size={14} /></button>
              </div>
            ))}

            <button className="btn btn-primary" type="submit" disabled={!name || selectedStops.length === 0} style={{ marginTop: '1rem' }}>
              Save route
            </button>
            {message && <p style={{ marginTop: '0.6rem' }}>{message}</p>}
          </form>
        </div>

        <div className="card">
          <h3>Available facilities</h3>
          {facilities.map((f) => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{f.name}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{f.address}</div>
              </div>
              <button className="btn" style={{ background: 'var(--color-bg)', fontSize: '0.8rem' }} onClick={() => addStop(f)}>Add</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Saved routes</h3>
        {routes.length === 0 && <p>No routes saved yet.</p>}
        {routes.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span>{r.name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>· limit {r.cold_chain_limit_hours}h</span></span>
            <button className="btn" style={{ background: 'var(--color-bg)' }} onClick={() => viewRoute(r.id)}>View</button>
          </div>
        ))}

        {activeRoute && (
          <div className="card" style={{ marginTop: '1rem', background: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h3 style={{ margin: 0 }}>{activeRoute.route.name}</h3>
              {activeRoute.exceedsColdChain ? (
                <span className="pill-badge warn">Exceeds cold-chain limit ({activeRoute.totalHours}h)</span>
              ) : (
                <span className="pill-badge">Within limit ({activeRoute.totalHours}h)</span>
              )}
            </div>
            {activeRoute.legs.map((leg) => (
              <div key={leg.facility_id} style={{ fontSize: '0.88rem', padding: '0.3rem 0' }}>
                {leg.stop_order}. {leg.name} — travel {leg.travelMinutes}min, service {leg.service_minutes}min (cumulative {Math.round(leg.cumulativeMinutes)}min)
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

const { pool } = require('../config/db');

// Haversine distance in km between two lat/lng points - used to estimate
// travel time between outreach stops against the cold-chain time budget.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AVG_SPEED_KMH = 30;

async function create(createdBy, { name, coldChainLimitHours, stops }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO vaccination_routes (created_by, name, cold_chain_limit_hours) VALUES (?, ?, ?)',
      [createdBy, name, coldChainLimitHours || 8]
    );
    const routeId = result.insertId;
    let order = 1;
    for (const s of stops) {
      await conn.query(
        'INSERT INTO vaccination_route_stops (route_id, facility_id, stop_order, service_minutes) VALUES (?, ?, ?, ?)',
        [routeId, s.facilityId, order++, s.serviceMinutes || 20]
      );
    }
    await conn.commit();
    return routeId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listForUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM vaccination_routes WHERE created_by = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function getWithStops(routeId) {
  const [[route]] = await pool.query('SELECT * FROM vaccination_routes WHERE id = ?', [routeId]);
  if (!route) return null;

  const [stops] = await pool.query(
    `SELECT vrs.stop_order, vrs.service_minutes, f.id AS facility_id, f.name, f.latitude, f.longitude, f.address
     FROM vaccination_route_stops vrs
     JOIN healthcare_facilities f ON f.id = vrs.facility_id
     WHERE vrs.route_id = ? ORDER BY vrs.stop_order ASC`,
    [routeId]
  );

  // Compute cumulative travel + service time across the planned stop order.
  let totalMinutes = 0;
  let prev = null;
  const legs = stops.map((s) => {
    let travelMinutes = 0;
    if (prev && s.latitude && s.longitude && prev.latitude && prev.longitude) {
      const km = haversineKm(prev.latitude, prev.longitude, s.latitude, s.longitude);
      travelMinutes = Math.round((km / AVG_SPEED_KMH) * 60);
    }
    totalMinutes += travelMinutes + s.service_minutes;
    prev = s;
    return { ...s, travelMinutes, cumulativeMinutes: totalMinutes };
  });

  const totalHours = totalMinutes / 60;
  return {
    route,
    legs,
    totalHours: Math.round(totalHours * 10) / 10,
    exceedsColdChain: totalHours > Number(route.cold_chain_limit_hours),
  };
}

module.exports = { create, listForUser, getWithStops };

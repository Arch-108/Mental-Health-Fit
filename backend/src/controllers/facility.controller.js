const facilityModel = require('../models/facility.model');

// Healthcare Resource Map - backed by seeded demo data (see schema.sql).
// Replace with real facility data (and ideally a verified data source)
// before any real deployment - never invent facility information.
async function search(req, res) {
  try {
    const { type, telehealthOnly } = req.query;
    const facilities = await facilityModel.search({ type, telehealthOnly });
    return res.json({ facilities });
  } catch (err) {
    console.error('search (facility) error:', err);
    return res.status(500).json({ error: 'Could not fetch facilities.' });
  }
}

module.exports = { search };

const vaccinationRouteModel = require('../models/vaccinationRoute.model');

async function create(req, res) {
  try {
    const { name, coldChainLimitHours, stops } = req.body;
    if (!name || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: 'name and at least one stop are required.' });
    }
    const routeId = await vaccinationRouteModel.create(req.user.id, { name, coldChainLimitHours, stops });
    return res.status(201).json({ id: routeId });
  } catch (err) {
    console.error('create (vaccination route) error:', err);
    return res.status(500).json({ error: 'Could not save the route.' });
  }
}

async function listMine(req, res) {
  try {
    const routes = await vaccinationRouteModel.listForUser(req.user.id);
    return res.json({ routes });
  } catch (err) {
    console.error('listMine (vaccination route) error:', err);
    return res.status(500).json({ error: 'Could not fetch routes.' });
  }
}

async function getOne(req, res) {
  try {
    const details = await vaccinationRouteModel.getWithStops(req.params.id);
    if (!details) return res.status(404).json({ error: 'Route not found.' });
    return res.json(details);
  } catch (err) {
    console.error('getOne (vaccination route) error:', err);
    return res.status(500).json({ error: 'Could not fetch route details.' });
  }
}

module.exports = { create, listMine, getOne };

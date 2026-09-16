const announcementModel = require('../models/announcement.model');

async function create(req, res) {
  try {
    const { title, body } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'title and body are required.' });
    }
    const id = await announcementModel.create(req.user.id, { title: title.trim(), body: body.trim() });
    return res.status(201).json({ id });
  } catch (err) {
    console.error('create (announcement) error:', err);
    return res.status(500).json({ error: 'Could not post the announcement.' });
  }
}

async function list(req, res) {
  try {
    const announcements = await announcementModel.listRecent();
    return res.json({ announcements });
  } catch (err) {
    console.error('list (announcements) error:', err);
    return res.status(500).json({ error: 'Could not fetch announcements.' });
  }
}

module.exports = { create, list };

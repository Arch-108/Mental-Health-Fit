const notificationModel = require('../models/notification.model');

async function listMine(req, res) {
  try {
    const notifications = await notificationModel.listForUser(req.user.id);
    return res.json({ notifications });
  } catch (err) {
    console.error('listMine (notification) error:', err);
    return res.status(500).json({ error: 'Could not fetch notifications.' });
  }
}

async function markRead(req, res) {
  try {
    await notificationModel.markRead(req.params.id, req.user.id);
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('markRead error:', err);
    return res.status(500).json({ error: 'Could not update notification.' });
  }
}

module.exports = { listMine, markRead };

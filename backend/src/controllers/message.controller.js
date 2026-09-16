const messageModel = require('../models/message.model');

async function send(req, res) {
  try {
    const { recipientId, body, relatedPatientId } = req.body;
    if (!recipientId || !body?.trim()) {
      return res.status(400).json({ error: 'recipientId and body are required.' });
    }
    if (Number(recipientId) === req.user.id) {
      return res.status(400).json({ error: "You can't message yourself." });
    }
    const id = await messageModel.send({
      senderId: req.user.id,
      recipientId,
      body: body.trim(),
      relatedPatientId,
    });
    return res.status(201).json({ id });
  } catch (err) {
    console.error('send (message) error:', err);
    return res.status(500).json({ error: 'Could not send the message.' });
  }
}

async function listThreads(req, res) {
  try {
    const threads = await messageModel.listThreads(req.user.id);
    return res.json({ threads });
  } catch (err) {
    console.error('listThreads error:', err);
    return res.status(500).json({ error: 'Could not fetch messages.' });
  }
}

async function listConversation(req, res) {
  try {
    const otherUserId = Number(req.params.userId);
    const messages = await messageModel.listConversation(req.user.id, otherUserId);
    await messageModel.markThreadRead(req.user.id, otherUserId);
    return res.json({ messages });
  } catch (err) {
    console.error('listConversation error:', err);
    return res.status(500).json({ error: 'Could not fetch this conversation.' });
  }
}

async function listStaff(req, res) {
  try {
    const staff = await messageModel.listStaffDirectory(req.user.id);
    return res.json({ staff });
  } catch (err) {
    console.error('listStaff error:', err);
    return res.status(500).json({ error: 'Could not fetch the staff directory.' });
  }
}

module.exports = { send, listThreads, listConversation, listStaff };

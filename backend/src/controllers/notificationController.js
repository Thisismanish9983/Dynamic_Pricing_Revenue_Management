const { Notification } = require('../../../database/models');

/**
 * Get all notifications for the tenant
 */
exports.getNotifications = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { type, read } = req.query;

    const query = { organizationId: orgId };
    if (type && type !== 'all') {
      query.type = type;
    }
    if (read !== undefined && read !== 'all') {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ organizationId: orgId, read: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error('[Notification Controller Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mark all unread notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    await Notification.updateMany({ organizationId: orgId, read: false }, { read: true });

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, organizationId: orgId });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification dismissed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Clear all notifications
 */
exports.clearAll = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    await Notification.deleteMany({ organizationId: orgId });

    res.status(200).json({ success: true, message: 'All alerts cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

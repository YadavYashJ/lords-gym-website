const enquiryService = require('../services/enquiry.service');
const db = require('../db');
const { hash } = require('../utils/hash');

module.exports = {
  pipeline: (req, res) => {
    const status = req.query.status;
    const list = enquiryService.listEnquiries(status);
    const stats = enquiryService.getStats();

    res.json({
      ok: true,
      success: true,
      stats,
      enquiries: list,
      count: list.length
    });
  },

  updateEnquiryStatus: (req, res) => {
    const { status } = req.body || {};
    const updated = enquiryService.updateStatus(req.params.id, status);
    res.json({ ok: true, success: true, enquiry: updated });
  },

  stats: (req, res) => {
    res.json({ ok: true, stats: enquiryService.getStats() });
  },

  listUsers: (req, res) => {
    const users = db.list('users', u => u.role === 'member').map(u => {
      const { pass, ...safe } = u;
      const plan = u.active_plan_id ? db.find('membership_plans', u.active_plan_id) : null;

      let daysLeft = null;
      if (u.subscription_end) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const end = new Date(u.subscription_end + 'T00:00:00');
        daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));
      }

      return {
        ...safe,
        plan_name: plan ? plan.plan_name : null,
        plan_price: plan ? plan.price : null,
        daysLeft
      };
    });
    res.json({ ok: true, users, count: users.length });
  },

  activatePlan: (req, res) => {
    const { plan_id, duration_days } = req.body || {};
    const userId = req.params.id;

    if (!plan_id) return res.status(400).json({ ok: false, error: 'plan_id is required' });

    const plan = db.find('membership_plans', plan_id);
    if (!plan) return res.status(404).json({ ok: false, error: 'Plan not found' });

    const user = db.find('users', userId);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const days = Number(duration_days) || plan.duration || 30;
    const today = new Date();
    const end = new Date(today.getTime() + days * 86400000);

    const startStr = today.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const updated = db.update('users', userId, {
      active_plan_id: Number(plan_id),
      subscription_start: startStr,
      subscription_end: endStr
    });

    const { pass: _, ...safe } = updated;
    res.json({ ok: true, success: true, user: safe, message: `Plan activated for ${user.full_name}` });
  }
};

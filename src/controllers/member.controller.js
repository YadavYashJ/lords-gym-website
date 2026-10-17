const db = require('../db');

module.exports = {
  dashboard: (req, res) => {
    const user = req.user; // guaranteed by requireAuth middleware
    const plan = user.active_plan_id ? db.find('membership_plans', user.active_plan_id) : null;
    const hasPlan = !!plan;

    let daysLeft = 0, daysElapsed = 0, cyclePercent = 0;

    if (hasPlan && user.subscription_end) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const endDate = new Date(user.subscription_end + 'T00:00:00');
      daysLeft = Math.max(0, Math.ceil((endDate - today) / 86400000));
    }

    if (hasPlan && user.subscription_start) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const startDate = new Date(user.subscription_start + 'T00:00:00');
      daysElapsed = Math.max(0, Math.floor((today - startDate) / 86400000));
      const total = daysElapsed + daysLeft;
      if (total > 0) cyclePercent = Math.min(100, Math.round((daysElapsed / total) * 100));
    }

    res.json({
      ok: true,
      success: true,
      member: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        hasPlan,
        plan_id: user.active_plan_id || null,
        plan_name: plan ? plan.plan_name : null,
        plan_price: plan ? plan.price : null,
        inclusions: plan ? plan.inclusions : null,
        subscription_start: user.subscription_start || null,
        subscription_end: user.subscription_end || null,
        daysLeft,
        daysElapsed,
        cyclePercent
      }
    });
  }
};

const db = require('../db');

module.exports = {
  getMemberDashboard(userId) {
    const user = db.find('users', userId);
    if (!user || user.role !== 'member') {
      throw { status: 404, message: 'Active member record not found' };
    }

    const plan = db.find('membership_plans', user.active_plan_id) || {};

    let daysLeft = 0;
    let daysElapsed = 0;
    let cyclePercent = 0;

    if (user.subscription_end) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(user.subscription_end + 'T00:00:00');
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    if (user.subscription_start) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(user.subscription_start + 'T00:00:00');
      const diffTime = today.getTime() - startDate.getTime();
      daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      const total = daysElapsed + daysLeft;
      if (total > 0) {
        cyclePercent = Math.min(100, Math.max(0, Math.round((daysElapsed / total) * 100)));
      }
    }

    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      plan_name: plan.plan_name || 'Normal Gym',
      plan_price: plan.price || 1500,
      inclusions: plan.inclusions || 'Full gym facility access',
      subscription_start: user.subscription_start,
      subscription_end: user.subscription_end,
      daysLeft,
      daysElapsed,
      cyclePercent
    };
  }
};

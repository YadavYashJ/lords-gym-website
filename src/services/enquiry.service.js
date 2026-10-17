const db = require('../db');
const { str, isIndianMobile, sanitize } = require('../utils/validate');

module.exports = {
  createEnquiry({ name, mobile, plan, message, slot }) {
    const cleanName = str(name, 100);
    const cleanMobile = str(mobile, 10);
    if (!cleanName || cleanName.length < 2) {
      throw { status: 400, message: 'Valid name is required (min 2 characters)' };
    }
    if (!isIndianMobile(cleanMobile)) {
      throw { status: 400, message: 'Must be a valid 10-digit Indian mobile number starting with 6–9' };
    }

    const plans = db.list('membership_plans');
    const matchedPlan = plans.find(p => p.plan_name.toLowerCase() === str(plan).toLowerCase()) || null;

    const record = db.create('enquiries', {
      visitor_name: sanitize(cleanName),
      mobile: cleanMobile,
      plan_id: matchedPlan ? matchedPlan.id : null,
      plan_label: sanitize(str(plan, 120)),
      plan_price: matchedPlan ? matchedPlan.price : null,
      message: sanitize(str(message, 1000)),
      slot_pref: sanitize(str(slot, 60)) || 'Morning 6AM-9AM',
      status: 'New'
    });

    const ticket = 'LG-' + String(record.id).padStart(4, '0');
    db.update('enquiries', record.id, { ticket });
    return { ...record, ticket };
  },

  listEnquiries(statusFilter) {
    let list = db.list('enquiries');
    if (statusFilter && statusFilter !== 'All') {
      list = list.filter(e => e.status === statusFilter);
    }
    return list.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },

  getStats() {
    const all = db.list('enquiries');
    return {
      total: all.length,
      new_count: all.filter(e => e.status === 'New').length,
      contacted_count: all.filter(e => e.status === 'Contacted').length,
      converted_count: all.filter(e => e.status === 'Converted' || e.status === 'Enrolled').length,
      dropped_count: all.filter(e => e.status === 'Dropped' || e.status === 'Closed').length
    };
  },

  updateStatus(id, newStatus) {
    const valid = ['New', 'Contacted', 'Converted', 'Dropped'];
    if (!valid.includes(newStatus)) {
      throw { status: 400, message: 'Invalid status' };
    }
    const updated = db.update('enquiries', id, { status: newStatus });
    if (!updated) throw { status: 404, message: 'Enquiry not found' };
    return updated;
  }
};

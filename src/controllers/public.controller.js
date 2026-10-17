const db = require('../db');
const enquiryService = require('../services/enquiry.service');

module.exports = {
  health: (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString(), gym: "LORD'S GYM Sachin" });
  },

  plans: (req, res) => {
    res.json({ ok: true, plans: db.list('membership_plans') });
  },

  amenities: (req, res) => {
    res.json({ ok: true, amenities: db.list('amenities') });
  },

  submitEnquiry: (req, res) => {
    const b = req.body || {};
    // Anti-bot honeypot check
    if (b.website) return res.json({ ok: true, ticket: 'LG-0000' });

    const result = enquiryService.createEnquiry({
      name: b.name || b.visitor_name,
      mobile: b.mobile,
      plan: b.plan || b.plan_label,
      message: b.message,
      slot: b.slot || b.slot_pref
    });

    res.status(201).json({
      ok: true,
      success: true,
      message: "Enquiry dispatched to Owner Imran Pathan's terminal",
      ticket: result.ticket,
      enquiry_id: result.id
    });
  }
};

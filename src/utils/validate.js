// Input sanitizing and whitelisting
const str = (v, n = 250) => String(v ?? '').trim().slice(0, n);
const isEmail = v => /^\S+@\S+\.\S+$/.test(String(v || ''));
const isIndianMobile = v => /^[6-9][0-9]{9}$/.test(String(v || '').trim());
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

const ENQUIRY_STATUSES = ['New', 'Contacted', 'Converted', 'Dropped'];
const ROLES = ['admin', 'member'];

function sanitize(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  str,
  isEmail,
  isIndianMobile,
  isDate,
  sanitize,
  ENQUIRY_STATUSES,
  ROLES,
};

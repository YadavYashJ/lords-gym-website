
// ── Responsive Mobile Navigation Toggle ───────────────────────────────────
function toggleMobileNav() {
  const menu = document.getElementById('mobileNavMenu');
  const icon = document.getElementById('mobileMenuIcon');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (icon) icon.textContent = 'close';
  } else {
    menu.classList.add('hidden');
    if (icon) icon.textContent = 'menu';
  }
}
window.toggleMobileNav = toggleMobileNav;
/* ============================================================
   LORD'S GYM — Core Client Application Layer
   Lead Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
   Location: Sachin, Surat | Facility: 2nd Floor, Goga Maharaj Complex
   ============================================================ */

const API = {
  async get(url) {
    const res = await fetch('/api' + url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (res.status === 401 || res.status === 403) {
      return { _authError: true, status: res.status };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
    return json;
  },

  async post(url, data) {
    const res = await fetch('/api' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin'
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
    return json;
  },

  async patch(url, data) {
    const res = await fetch('/api' + url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin'
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
    return json;
  }
};

// ── Global Toast Helper ─────────────────────────────────────────────────────
function showToast(message, isError = false) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 transform translate-y-20 opacity-0';
    document.body.appendChild(toast);
  }
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 transform translate-y-0 opacity-100 ${
    isError ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
  }`;
  toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">${isError ? 'error' : 'check_circle'}</span><span>${message}</span>`;
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 4000);
}

// ── Global Session / Logout ─────────────────────────────────────────────────
async function handleLogout() {
  try {
    await API.post('/logout', {});
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('lg_session');
  window.location.href = '/login';
}

// ── Page Auth Guards ────────────────────────────────────────────────────────
async function enforceAuthGuard() {
  const path = window.location.pathname;

  if (path.includes('/admin')) {
    // Must be authenticated as admin
    const res = await API.get('/me');
    if (res._authError || !res.user || res.user.role !== 'admin') {
      localStorage.removeItem('lg_session');
      window.location.href = '/login';
      return false;
    }
    localStorage.setItem('lg_session', JSON.stringify(res.user));
    return true;
  }

  if (path.includes('/member')) {
    // Must be authenticated as member
    const res = await API.get('/me');
    if (res._authError || !res.user) {
      localStorage.removeItem('lg_session');
      window.location.href = '/login';
      return false;
    }
    // Admin always routed to Command Center
    if (res.user.role === 'admin') {
      window.location.href = '/admin';
      return false;
    }
    localStorage.setItem('lg_session', JSON.stringify(res.user));
    return true;
  }

  return true;
}

// ── Authentication Pages Handling (login.html) ──────────────────────────────
function initAuthForms() {
  const memberForm = document.getElementById('memberLoginForm');
  const registerForm = document.getElementById('registerForm');
  const adminForm = document.getElementById('adminLoginForm');
  const alertBox = document.getElementById('authAlert');

  function showAlert(msg, isSuccess = false) {
    if (!alertBox) {
      alert(msg);
      return;
    }
    alertBox.classList.remove('hidden', 'bg-red-950/80', 'text-red-300', 'border-red-800', 'bg-emerald-950/80', 'text-emerald-300', 'border-emerald-800');
    if (isSuccess) {
      alertBox.classList.add('bg-emerald-950/80', 'text-emerald-300', 'border-emerald-800');
    } else {
      alertBox.classList.add('bg-red-950/80', 'text-red-300', 'border-red-800');
    }
    alertBox.textContent = msg;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Member Login
  if (memberForm) {
    memberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('loginUser')?.value.trim();
      const pass = document.getElementById('loginPass')?.value;
      const btn = document.getElementById('loginSubmitBtn');

      if (!user || !pass) return showAlert('Please fill in both email/mobile and password.');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Verifying...';

      try {
        const res = await API.post('/login', { user, pass });
        if (res.ok && res.user) {
          localStorage.setItem('lg_session', JSON.stringify(res.user));
          showAlert('Login successful! Redirecting...', true);
          setTimeout(() => {
            window.location.href = res.role === 'admin' ? '/admin' : '/member';
          }, 400);
        }
      } catch (err) {
        showAlert(err.message || 'Invalid credentials. Please verify your details.');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In to Member Dashboard</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
      }
    });
  }

  // User Registration
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const mobile = document.getElementById('regMobile')?.value.trim();
      const password = document.getElementById('regPass')?.value;
      const btn = document.getElementById('registerSubmitBtn');

      if (!full_name || !email || !mobile || !password) {
        return showAlert('Please complete all registration fields.');
      }
      if (!/^[6-9][0-9]{9}$/.test(mobile)) {
        return showAlert('Enter a valid 10-digit Indian mobile number (starting with 6-9).');
      }
      if (password.length < 8) {
        return showAlert('Password must be at least 8 characters long.');
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Registering Account...';

      try {
        const res = await API.post('/register', { full_name, email, mobile, password });
        if (res.ok && res.user) {
          localStorage.setItem('lg_session', JSON.stringify(res.user));
          showAlert('Registration successful! Redirecting to your new dashboard...', true);
          setTimeout(() => {
            window.location.href = '/member';
          }, 600);
        }
      } catch (err) {
        showAlert(err.message || 'Registration failed. An account with this email may already exist.');
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account & Sign In</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
      }
    });
  }

  // Admin Login
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminEmail')?.value.trim();
      const pass = document.getElementById('adminPass')?.value;
      const btn = document.getElementById('adminSubmitBtn');

      if (!email || !pass) return showAlert('Enter both admin handle and security key.');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Authenticating Admin...';

      try {
        const res = await API.post('/login', { user: email, pass });
        if (res.ok && res.user) {
          if (res.user.role !== 'admin') {
            showAlert('Access Denied: This account does not possess Facility Admin clearance.');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified_user</span><span>Authenticate Admin Terminal</span>';
            return;
          }
          localStorage.setItem('lg_session', JSON.stringify(res.user));
          showAlert('Clearance Level 1 Confirmed! Opening Command Center...', true);
          setTimeout(() => {
            window.location.href = '/admin';
          }, 400);
        }
      } catch (err) {
        showAlert(err.message || 'Admin authentication failed. Invalid admin email or security key.');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified_user</span><span>Authenticate Admin Terminal</span>';
      }
    });
  }
}

// ── Member Dashboard Wire (member.html) ─────────────────────────────────────
async function initMemberDashboard() {
  if (!window.location.pathname.includes('/member')) return;

  const authOk = await enforceAuthGuard();
  if (!authOk) return;

  try {
    const res = await API.get('/dashboard');
    if (res._authError || !res.member) {
      window.location.href = '/login';
      return;
    }

    const m = res.member;

    // Set Welcome Header
    const welcomeTitle = document.getElementById('memberWelcomeTitle');
    if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${m.name}`;

    const memberInitials = document.getElementById('memberInitials');
    if (memberInitials && m.name) {
      const parts = m.name.split(' ');
      memberInitials.textContent = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
    }

    const headerName = document.getElementById('headerMemberName');
    if (headerName) headerName.textContent = m.name;

    const sidebarMemberName = document.getElementById('sidebarMemberName');
    if (sidebarMemberName) sidebarMemberName.textContent = m.name;

    const accessId = document.getElementById('memberAccessId');
    if (accessId) accessId.textContent = `LG-2026-${String(m.id).padStart(4, '0')}`;

    const qrToken = document.getElementById('memberQrToken');
    if (qrToken) qrToken.textContent = `LG-2026-${String(m.id).padStart(4, '0')}`;

    // Switch between Active Plan View vs New User / No Plan View
    const activeView = document.getElementById('activePlanView');
    const noPlanView = document.getElementById('noPlanView');
    const statusBadge = document.getElementById('memberStatusBadge');

    if (m.hasPlan) {
      if (activeView) activeView.classList.remove('hidden');
      if (noPlanView) noPlanView.classList.add('hidden');

      if (statusBadge) {
        statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> ${m.plan_name.toUpperCase()} (ACTIVE)`;
        statusBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-xs font-bold';
      }

      // Update days left dial
      const daysCount = document.getElementById('daysLeftCount');
      if (daysCount) daysCount.textContent = m.daysLeft;

      const daysText = document.getElementById('daysLeftText');
      if (daysText) daysText.textContent = `${m.daysLeft} Days Left`;

      const renewalDate = document.getElementById('renewalDateText');
      if (renewalDate && m.subscription_end) {
        const d = new Date(m.subscription_end);
        renewalDate.textContent = `Valid Through: ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }

      const expendedText = document.getElementById('daysExpendedText');
      if (expendedText) expendedText.textContent = `${m.daysElapsed || 0} Days Expended`;

      const planNameDetail = document.getElementById('activePlanNameDetail');
      if (planNameDetail) planNameDetail.textContent = m.plan_name;

      const planPriceDetail = document.getElementById('activePlanPriceDetail');
      if (planPriceDetail) planPriceDetail.textContent = `₹${m.plan_price.toLocaleString('en-IN')} / mo`;

    } else {
      // New User View: NO PLAN YET
      if (activeView) activeView.classList.add('hidden');
      if (noPlanView) noPlanView.classList.remove('hidden');

      if (statusBadge) {
        statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> PENDING MEMBERSHIP ACTIVATION`;
        statusBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold';
      }

      // Prefill enquiry form for new member
      const enqName = document.getElementById('newMemberEnqName');
      if (enqName) enqName.value = m.name || '';
      const enqMobile = document.getElementById('newMemberEnqMobile');
      if (enqMobile) enqMobile.value = m.mobile || '';
    }

  } catch (err) {
    console.error('Member dashboard error:', err);
  }
}

// ── New Member Direct Plan Request ──────────────────────────────────────────
async function submitMemberEnquiry(planChoice) {
  const session = JSON.parse(localStorage.getItem('lg_session') || '{}');
  const name = session.full_name || document.getElementById('newMemberEnqName')?.value || 'Member';
  const mobile = session.mobile || document.getElementById('newMemberEnqMobile')?.value || '';
  const message = document.getElementById('newMemberEnqMsg')?.value || `Interested in enrolling in ${planChoice} plan. Requesting face-to-face onboarding.`;
  const slot = document.getElementById('newMemberEnqSlot')?.value || 'Morning 6AM-9AM';

  if (!mobile || !/^[6-9][0-9]{9}$/.test(mobile)) {
    alert('Please ensure a valid 10-digit mobile number is provided.');
    return;
  }

  try {
    const res = await API.post('/enquiry', {
      name,
      mobile,
      plan: planChoice,
      message,
      slot
    });

    showToast(`Enquiry for ${planChoice} sent to Coach Imran! Ticket: ${res.ticket}`);
    const banner = document.getElementById('enquirySuccessBanner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.innerHTML = `
        <div class="p-4 bg-emerald-900/60 border border-emerald-600 rounded-lg text-emerald-100 flex items-start gap-3">
          <span class="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
          <div>
            <h4 class="font-bold text-sm">Enquiry Successfully Logged! Ticket: ${res.ticket}</h4>
            <p class="text-xs text-emerald-200 mt-0.5">Coach Imran Pathan has received your request for <strong>${planChoice}</strong>. Visit the 2nd Floor desk for face-to-face payment (Cash / UPI) to start your membership.</p>
          </div>
        </div>
      `;
      banner.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    showToast(err.message || 'Failed to submit enquiry.', true);
  }
}

// ── Admin Command Center Wire (admin.html) ──────────────────────────────────
async function loadAdminData() {
  await loadAdminPipeline();
  await loadAdminUsers();
  showToast('Telemetry & roster updated.');
}
window.loadAdminData = loadAdminData;

async function initAdminDashboard() {
  if (!window.location.pathname.includes('/admin')) return;

  const authOk = await enforceAuthGuard();
  if (!authOk) return;

  // Load Enquiries Pipeline
  await loadAdminPipeline();
  // Load Registered Users
  await loadAdminUsers();
}

async function loadAdminPipeline(filter = 'all') {
  const tbody = document.getElementById('adminPipelineBody');
  if (!tbody) return;

  try {
    const url = filter === 'all' ? '/admin/pipeline' : `/admin/pipeline?status=${filter}`;
    const res = await API.get(url);
    if (!res.ok) return;

    // Update Telemetry Counts
    const stats = res.stats || {};
    const totalCount = document.getElementById('statTotalEnquiries');
    if (totalCount) totalCount.textContent = stats.total || 0;
    const newCount = document.getElementById('statNewEnquiries');
    if (newCount) newCount.textContent = stats.new || 0;
    const contactedCount = document.getElementById('statContactedEnquiries');
    if (contactedCount) contactedCount.textContent = stats.contacted || 0;
    const enrolledCount = document.getElementById('statEnrolledEnquiries');
    if (enrolledCount) enrolledCount.textContent = stats.enrolled || 0;

    tbody.innerHTML = '';
    const leadsSummary = document.getElementById('leadsFooterSummary');
    if (leadsSummary) {
      leadsSummary.textContent = `Displaying ${res.enquiries ? res.enquiries.length : 0} enquiry record${(res.enquiries && res.enquiries.length === 1) ? '' : 's'} from website`;
    }

    if (!res.enquiries || res.enquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No enquiries recorded under this filter.</td></tr>`;
      return;
    }

    res.enquiries.forEach(e => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs';

      const dateStr = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently';

      let statusBadge = '';
      if (e.status === 'New') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">New</span>';
      } else if (e.status === 'Contacted') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">Contacted</span>';
      } else {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Enrolled</span>';
      }

      tr.innerHTML = `
        <td class="p-3 text-slate-400 whitespace-nowrap">${dateStr}</td>
        <td class="p-3 font-bold text-white whitespace-nowrap">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center text-[10px] font-bold">${(e.name || 'V')[0]}</span>
            <span>${e.name}</span>
          </div>
        </td>
        <td class="p-3 whitespace-nowrap">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-200 font-mono">+91 ${e.mobile}</span>
            <a href="tel:${e.mobile}" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300" title="Call"><span class="material-symbols-outlined text-[14px]">call</span></a>
            <a href="https://wa.me/91${e.mobile}?text=Hi%20${encodeURIComponent(e.name)},%20Coach%20Imran%20Pathan%20here%20from%20LORD%27S%20GYM%20Sachin." target="_blank" class="p-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300" title="WhatsApp"><span class="material-symbols-outlined text-[14px]">chat</span></a>
          </div>
        </td>
        <td class="p-3 text-slate-300">${e.plan || 'General Inquiry'}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3 text-right whitespace-nowrap">
          <select onchange="changeEnquiryStatus(${e.id}, this.value)" class="bg-[#132238] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none">
            <option value="New" ${e.status === 'New' ? 'selected' : ''}>Stage: New</option>
            <option value="Contacted" ${e.status === 'Contacted' ? 'selected' : ''}>Stage: Contacted</option>
            <option value="Enrolled" ${e.status === 'Enrolled' ? 'selected' : ''}>Stage: Enrolled</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Failed to load admin pipeline:', err);
  }
}

async function changeEnquiryStatus(id, newStatus) {
  try {
    await API.patch(`/admin/enquiries/${id}`, { status: newStatus });
    showToast(`Lead #${id} updated to ${newStatus}`);
    await loadAdminPipeline();
  } catch (err) {
    showToast('Failed to update lead status.', true);
  }
}

// ── Admin Members Roster & Plan Activation ──────────────────────────────────
async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  try {
    const res = await API.get('/admin/users');
    if (!res.ok || !res.users) return;

    // Calculate real dynamic numbers based ONLY on actual accounts
    const totalUsers = res.users.length;
    const activeMembers = res.users.filter(u => !!u.active_plan_id);
    const activeCount = activeMembers.length;
    const monthlyRevenue = activeMembers.reduce((sum, u) => {
      const price = u.plan_price || (u.active_plan_id === 1 ? 1500 : u.active_plan_id === 2 ? 4000 : u.active_plan_id === 3 ? 5000 : 0);
      return sum + price;
    }, 0);

    const statTotalEl = document.getElementById('statTotalUsers');
    if (statTotalEl) statTotalEl.textContent = totalUsers;

    const statActiveCountEl = document.getElementById('statActiveCount');
    if (statActiveCountEl) statActiveCountEl.textContent = activeCount;

    const statActiveMembersCountEl = document.getElementById('statActiveMembersCount');
    if (statActiveMembersCountEl) statActiveMembersCountEl.textContent = activeCount;

    const statRevenueEl = document.getElementById('statMonthlyRevenue');
    if (statRevenueEl) statRevenueEl.textContent = '₹' + monthlyRevenue.toLocaleString('en-IN');

    const summaryEl = document.getElementById('rosterSummaryText');
    if (summaryEl) {
      summaryEl.textContent = `Showing ${totalUsers} registered user account${totalUsers === 1 ? '' : 's'} (${activeCount} enrolled with active gym membership)`;
    }

    const rosterBadge = document.getElementById('rosterActiveBadge');
    if (rosterBadge) {
      rosterBadge.textContent = `${activeCount} Active Member${activeCount === 1 ? '' : 's'}`;
    }

    tbody.innerHTML = '';

    if (res.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-on-surface-variant text-xs">No registered accounts found.</td></tr>';
      return;
    }

    res.users.forEach(u => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs';

      const hasPlan = !!u.active_plan_id;
      let planBadge = '';
      if (hasPlan) {
        planBadge = `
          <div>
            <span class="font-bold text-emerald-400">${u.plan_name}</span>
            <span class="block text-[11px] text-slate-400">${u.daysLeft !== null ? u.daysLeft + ' Days Left' : 'Active'}</span>
          </div>
        `;
      } else {
        planBadge = `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">No Active Plan</span>`;
      }

      tr.innerHTML = `
        <td class="p-3 font-mono text-slate-400">#LG-M-${String(u.id).padStart(4, '0')}</td>
        <td class="p-3 font-bold text-white whitespace-nowrap">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded bg-[#fd761a] text-white flex items-center justify-center text-xs font-bold">${u.full_name[0]}</span>
            <div>
              <p class="text-sm font-bold text-white">${u.full_name}</p>
              <p class="text-[11px] text-slate-400 font-normal">${u.email}</p>
            </div>
          </div>
        </td>
        <td class="p-3 whitespace-nowrap">
          <span class="font-mono text-slate-200">+91 ${u.mobile}</span>
        </td>
        <td class="p-3 whitespace-nowrap">${planBadge}</td>
        <td class="p-3 text-slate-400 text-[11px] whitespace-nowrap">
          ${u.subscription_end ? 'Expires ' + u.subscription_end : 'Awaiting payment'}
        </td>
        <td class="p-3 text-right whitespace-nowrap">
          <button onclick="openPlanActivationModal(${u.id}, '${encodeURIComponent(u.full_name)}')" class="px-2.5 py-1.5 bg-[#fd761a] hover:bg-[#ea580c] text-white font-bold text-xs rounded transition-all shadow inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>${hasPlan ? 'Renew / Change Plan' : 'Start Membership'}</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Failed to load admin users:', err);
  }
}

function openPlanActivationModal(userId, encodedName) {
  const name = decodeURIComponent(encodedName);
  const modal = document.getElementById('activatePlanModal');
  if (!modal) {
    alert(`Activating membership for User #${userId} (${name})`);
    return;
  }
  document.getElementById('modalUserId').value = userId;
  document.getElementById('modalUserName').textContent = name;
  modal.classList.remove('hidden');
}

function closePlanActivationModal() {
  const modal = document.getElementById('activatePlanModal');
  if (modal) modal.classList.add('hidden');
}

async function handleConfirmPlanActivation() {
  const userId = document.getElementById('modalUserId')?.value;
  const planId = document.getElementById('modalPlanSelect')?.value;
  const duration = document.getElementById('modalDurationSelect')?.value;
  const btn = document.getElementById('modalConfirmBtn');

  if (!userId || !planId) return;

  btn.disabled = true;
  btn.textContent = 'Activating...';

  try {
    const res = await API.patch(`/admin/users/${userId}/plan`, {
      plan_id: Number(planId),
      duration_days: Number(duration) || 30
    });

    showToast(res.message || 'Membership plan activated successfully!');
    closePlanActivationModal();
    await loadAdminUsers();
  } catch (err) {
    showToast(err.message || 'Failed to activate plan.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Activate Membership Pass';
  }
}

// ── Contact / Public Form Handling (contact.html & index.html) ─────────────
function initPublicEnquiryForms() {
  const form = document.getElementById('membershipEnquiryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('fullName');
    const mobileInput = document.getElementById('mobileNumber');
    const planSelect = document.getElementById('planChoice');
    const goalsInput = document.getElementById('fitnessGoals');
    const slotInput = form.querySelector('input[name="slotPreference"]:checked');
    const submitBtn = document.getElementById('submitBtn');
    const banner = document.getElementById('enquiryAlertBanner');
    const details = document.getElementById('enquiryAlertDetails');
    const ticketRef = document.getElementById('ticketRefNumber');

    const mobile = (mobileInput?.value || '').trim();
    if (!/^[6-9][0-9]{9}$/.test(mobile)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      mobileInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75');
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-headline-sm animate-spin">refresh</span><span>Dispatching to Coach Imran...</span>';
    }

    try {
      const res = await API.post('/enquiry', {
        name: nameInput?.value?.trim(),
        mobile: mobile,
        plan: planSelect?.value,
        message: goalsInput?.value?.trim(),
        slot: slotInput?.value || 'Morning 6AM-9AM'
      });

      if (ticketRef) ticketRef.textContent = res.ticket || 'LG-7489';
      if (details) {
        details.innerHTML = `<strong>${nameInput?.value}</strong>, your request for <strong>${planSelect?.value}</strong> has been logged to Imran Pathan's terminal. Confirmation dispatched to <strong>+91 ${mobile}</strong>.`;
      }
      if (banner) {
        banner.classList.remove('hidden');
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (submitBtn) {
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-headline-sm">done_all</span><span>Enquiry Sent Successfully</span>';
      }
      form.reset();
    } catch (err) {
      alert(err.message || 'Submission failed. Please check network.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75');
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-headline-sm">send</span><span>Send Enquiry to Owner Imran Pathan</span>';
      }
    }
  });
}

// ── Auto Initialization ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuthForms();
  initMemberDashboard();
  initAdminDashboard();
  initPublicEnquiryForms();
});

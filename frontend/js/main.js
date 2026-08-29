// ============================================================
// js/main.js  – Homepage & shared site-wide JS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll effect ──────────────────────────────────
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ── Auth nav state ────────────────────────────────────────
  updateNavAuth();

  // ── Set min date for search inputs ────────────────────────
  const dateInput = document.getElementById('searchDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // ── Search tabs ───────────────────────────────────────────
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ── Search form submit ────────────────────────────────────
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city       = document.getElementById('searchCity')?.value;
      const date       = document.getElementById('searchDate')?.value;
      const passengers = document.getElementById('searchPassengers')?.value || 1;
      const activeTab  = document.querySelector('.search-tab.active')?.dataset.type;
      const params     = new URLSearchParams({ ...(city && { city }), ...(date && { date }), passengers });
      const dest       = activeTab === 'tour' ? 'tours.html' : 'vehicles.html';
      window.location.href = `pages/${dest}?${params}`;
    });
  }

  // ── Load featured vehicles ────────────────────────────────
  loadFeaturedVehicles();
  loadFeaturedTours();

  // ── Animated counters ─────────────────────────────────────
  initCounters();

  // ── Logout ────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      showToast('Logged out successfully', 'success');
      setTimeout(() => window.location.href = '/index.html', 800);
    });
  }
});

// ─── Update navbar based on auth state ───────────────────
function updateNavAuth() {
  const user          = getUser();
  const authLinks     = document.getElementById('navAuthLinks');
  const userMenu      = document.getElementById('navUserMenu');
  const userNameEl    = document.getElementById('navUserName');

  if (user && isLoggedIn()) {
    authLinks?.classList.add('d-none');
    userMenu?.classList.remove('d-none');
    if (userNameEl) userNameEl.textContent = user.name?.split(' ')[0] || 'User';

    // Adjust dashboard link based on role
    const dashLink = document.querySelector('[href="pages/dashboard.html"]');
    if (dashLink && user.role === 'admin')  dashLink.href = 'pages/admin-dashboard.html';
    if (dashLink && user.role === 'owner')  dashLink.href = 'pages/owner-dashboard.html';
  } else {
    authLinks?.classList.remove('d-none');
    userMenu?.classList.add('d-none');
  }
}

// ─── Featured Vehicles ────────────────────────────────────
async function loadFeaturedVehicles() {
  const container = document.getElementById('vehiclesContainer');
  if (!container) return;
  try {
    const res = await VehicleAPI.getAll({ limit: 6, sort: '-rating' });
    document.getElementById('vehicleLoader')?.remove();
    if (!res.data?.length) {
      container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="fas fa-car fa-2x mb-2"></i><p>No vehicles available yet.</p></div>';
      return;
    }
    container.innerHTML = res.data.map(v => vehicleCardHTML(v)).join('');
  } catch (err) {
    document.getElementById('vehicleLoader')?.remove();
    container.innerHTML = '<div class="col-12 text-center text-muted py-4"><p>Could not load vehicles.</p></div>';
  }
}

// ─── Featured Tours ───────────────────────────────────────
async function loadFeaturedTours() {
  const container = document.getElementById('toursContainer');
  if (!container) return;
  try {
    const res = await TourAPI.getAll({ limit: 3 });
    if (!res.data?.length) {
      container.innerHTML = '<div class="col-12 text-center text-muted py-4"><p>No tour packages available yet.</p></div>';
      return;
    }
    container.innerHTML = res.data.map(t => tourCardHTML(t)).join('');
  } catch (err) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4"><p>Could not load tours.</p></div>';
  }
}

// ─── Vehicle Card HTML ────────────────────────────────────
function vehicleCardHTML(v) {
  const imgBg = ['#1a3c34', '#1a1a2e', '#003049', '#2d3a1e', '#3b1800'];
  const icons  = ['🚗','🚙','🏕️','🚌','🚐'];
  const rand   = Math.abs((v._id?.charCodeAt(0) || 0)) % 5;
  const img    = v.images?.[0]
    ? `<img src="${v.images[0]}" alt="${v.make}" loading="lazy"/>`
    : `<div class="card-placeholder-img" style="background:${imgBg[rand]}">${icons[rand]}</div>`;

  return `
  <div class="col-md-4 col-sm-6">
    <div class="vehicle-card h-100" onclick="window.location='pages/vehicle-details.html?id=${v._id}'">
      <div class="card-img-wrapper">
        ${img}
        <span class="card-badge">${capitalize(v.vehicleType || 'Vehicle')}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${v.make} ${v.model} (${v.year})</div>
        <div class="card-location"><i class="fas fa-map-marker-alt me-1"></i>${v.city}</div>
        <div class="card-features">
          <span class="feature-tag"><i class="fas fa-users me-1"></i>${v.seats} Seats</span>
          ${(v.features||[]).slice(0,2).map(f=>`<span class="feature-tag">${f}</span>`).join('')}
        </div>
        <div class="card-footer-row">
          <div class="price-tag">${formatCurrency(v.pricePerDay)}<small>/day</small></div>
          <div class="star-rating">
            ${'★'.repeat(Math.round(v.rating||0))}${'☆'.repeat(5-Math.round(v.rating||0))}
            <small class="text-muted ms-1">(${v.totalRatings||0})</small>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ─── Tour Card HTML ───────────────────────────────────────
function tourCardHTML(t) {
  const typeColors = { pilgrimage:'#1a1a2e', adventure:'#1a3c34', wildlife:'#3b1800', cultural:'#2d3a1e', wellness:'#003049', trekking:'#1a3a5c' };
  const typeIcons  = { pilgrimage:'🏛️', adventure:'🧗', wildlife:'🐯', cultural:'🎭', wellness:'🧘', trekking:'🥾' };
  const img = t.images?.[0]
    ? `<img src="${t.images[0]}" alt="${t.title}" loading="lazy"/>`
    : `<div class="card-placeholder-img" style="background:${typeColors[t.tourType]||'#1a3c34'}">${typeIcons[t.tourType]||'🏕️'}</div>`;

  return `
  <div class="col-md-4">
    <div class="tour-card h-100" onclick="window.location='pages/tour-details.html?id=${t._id}'">
      <div class="card-img-wrapper">
        ${img}
        <span class="card-badge">${capitalize(t.tourType||'Tour')}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${t.title}</div>
        <div class="card-location"><i class="fas fa-map-marker-alt me-1"></i>${t.startCity}</div>
        <div class="card-features">
          <span class="feature-tag"><i class="fas fa-calendar me-1"></i>${t.durationDays} Days</span>
          <span class="feature-tag"><i class="fas fa-users me-1"></i>Max ${t.maxGroupSize||15}</span>
          <span class="feature-tag">${capitalize(t.difficulty||'easy')}</span>
        </div>
        <div class="card-footer-row">
          <div class="price-tag">${formatCurrency(t.price)}<small>/person</small></div>
          <span class="badge bg-success">${capitalize(t.tourType)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

// ─── Destination quick search ─────────────────────────────
function searchDest(city) {
  window.location.href = `pages/vehicles.html?city=${encodeURIComponent(city)}`;
}

// ─── Counter animation ────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      let current  = 0;
      const step   = Math.ceil(target / 60);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current >= target) clearInterval(timer);
      }, 25);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ─── Utility ──────────────────────────────────────────────
function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

// ─── requireAuth guard (call on protected pages) ──────────
function requireAuth(redirectRole) {
  if (!isLoggedIn()) {
    window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }
  const user = getUser();
  if (redirectRole && user?.role !== redirectRole && user?.role !== 'admin') {
    showToast('Access denied for your role.', 'error');
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

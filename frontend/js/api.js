// ============================================================
// js/api.js - Centralised API Client
// All API calls go through this module
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ─── Token helpers ────────────────────────────────────────
const getToken  = () => localStorage.getItem('banjare_token');
const getUser   = () => { try { return JSON.parse(localStorage.getItem('banjare_user')); } catch { return null; } };
const setAuth   = (token, user) => { localStorage.setItem('banjare_token', token); localStorage.setItem('banjare_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('banjare_token'); localStorage.removeItem('banjare_user'); };
const isLoggedIn = () => !!getToken();

// ─── Core fetch wrapper ───────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']; // Let browser set multipart boundary
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Request failed', data };
    }
    return data;
  } catch (err) {
    if (err.status === 401) {
      clearAuth();
      window.location.href = '/pages/login.html?expired=1';
    }
    throw err;
  }
}

// ─── Auth API ─────────────────────────────────────────────
const AuthAPI = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: data }),
  login:    (data) => apiFetch('/auth/login',    { method: 'POST', body: data }),
  getMe:    ()     => apiFetch('/auth/me'),
  updateProfile:   (data) => apiFetch('/auth/update-profile', { method: 'PUT', body: data }),
  changePassword:  (data) => apiFetch('/auth/change-password', { method: 'PUT', body: data }),
  forgotPassword:  (data) => apiFetch('/auth/forgot-password', { method: 'POST', body: data }),
  resetPassword:   (data) => apiFetch('/auth/reset-password',  { method: 'POST', body: data }),
};

// ─── Vehicles API ─────────────────────────────────────────
const VehicleAPI = {
  getAll:      (params = {}) => apiFetch('/vehicles?' + new URLSearchParams(params)),
  getById:     (id)          => apiFetch(`/vehicles/${id}`),
  getMyListings: ()          => apiFetch('/vehicles/my-listings'),
  create:      (formData)    => apiFetch('/vehicles', { method: 'POST', body: formData }),
  update:      (id, formData)=> apiFetch(`/vehicles/${id}`, { method: 'PUT', body: formData }),
  delete:      (id)          => apiFetch(`/vehicles/${id}`, { method: 'DELETE' }),
};

// ─── Tours API ────────────────────────────────────────────
const TourAPI = {
  getAll:  (params = {}) => apiFetch('/tours?' + new URLSearchParams(params)),
  getById: (id)          => apiFetch(`/tours/${id}`),
  create:  (data)        => apiFetch('/tours', { method: 'POST', body: data }),
  update:  (id, data)    => apiFetch(`/tours/${id}`, { method: 'PUT', body: data }),
};

// ─── Bookings API ─────────────────────────────────────────
const BookingAPI = {
  create:          (data)   => apiFetch('/bookings', { method: 'POST', body: data }),
  getMyBookings:   (params) => apiFetch('/bookings?' + new URLSearchParams(params || {})),
  getOwnerBookings:(params) => apiFetch('/bookings/owner?' + new URLSearchParams(params || {})),
  getById:         (id)     => apiFetch(`/bookings/${id}`),
  cancel:          (id, reason) => apiFetch(`/bookings/${id}/cancel`, { method: 'PUT', body: { reason } }),
  calculatePrice:  (params) => apiFetch('/bookings/calculate-price?' + new URLSearchParams(params)),
};

// ─── Payments API ─────────────────────────────────────────
const PaymentAPI = {
  createOrder:  (data) => apiFetch('/payments/create-order', { method: 'POST', body: data }),
  verify:       (data) => apiFetch('/payments/verify',       { method: 'POST', body: data }),
  getMyPayments:()     => apiFetch('/payments/my'),
};

// ─── Reviews API ─────────────────────────────────────────
const ReviewAPI = {
  create:          (data)      => apiFetch('/reviews', { method: 'POST', body: data }),
  getByVehicle:    (vehicleId) => apiFetch(`/reviews/vehicle/${vehicleId}`),
};

// ─── Admin API ────────────────────────────────────────────
const AdminAPI = {
  getDashboard:    ()   => apiFetch('/admin/dashboard'),
  getPending:      ()   => apiFetch('/admin/pending-listings'),
  approveVehicle:  (id) => apiFetch(`/admin/approve/vehicle/${id}`, { method: 'PUT' }),
  rejectVehicle:   (id) => apiFetch(`/admin/reject/vehicle/${id}`,  { method: 'DELETE' }),
  approveTour:     (id) => apiFetch(`/admin/approve/tour/${id}`,    { method: 'PUT' }),
  getUsers:        (params) => apiFetch('/admin/users?' + new URLSearchParams(params || {})),
  toggleBlock:     (id) => apiFetch(`/admin/users/${id}/toggle-block`, { method: 'PUT' }),
  getAllBookings:   (params) => apiFetch('/admin/bookings?' + new URLSearchParams(params || {})),
};

// ─── Toast notification helper ────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  toast.innerHTML = `<span style="font-size:1.2rem">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideInRight 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ─── Razorpay checkout helper ─────────────────────────────
async function initiateRazorpayPayment(bookingId, onSuccess) {
  try {
    showToast('Creating payment order...', 'info');
    const orderData = await PaymentAPI.createOrder({ bookingId });

    const options = {
      key:        orderData.keyId,
      amount:     orderData.amount,
      currency:   orderData.currency,
      name:       'Banjare',
      description:'Travel Booking Payment',
      order_id:   orderData.orderId,
      prefill: {
        name:  getUser()?.name  || '',
        email: getUser()?.email || '',
      },
      theme: { color: '#2d6a4f' },
      handler: async (response) => {
        try {
          const verifyResult = await PaymentAPI.verify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            bookingId
          });
          showToast('Payment successful! Booking confirmed 🎉', 'success');
          if (onSuccess) onSuccess(verifyResult);
        } catch (err) {
          showToast('Payment verification failed. Contact support.', 'error');
        }
      },
      modal: { ondismiss: () => showToast('Payment cancelled.', 'warning') }
    };

    // Dynamically load Razorpay SDK if not present
    if (!window.Razorpay) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    new window.Razorpay(options).open();
  } catch (err) {
    showToast(err.message || 'Could not initiate payment', 'error');
  }
}

// ─── Utility helpers ──────────────────────────────────────
const formatCurrency = (n) => '₹' + Number(n).toLocaleString('en-IN');
const formatDate     = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const calcDays       = (s, e) => Math.ceil((new Date(e) - new Date(s)) / 86400000);

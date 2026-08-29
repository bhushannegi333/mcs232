# 🏔️ BANJARE – Tour, Travel & Vehicle Booking Platform (Uttarakhand)


**site is live at https :** (//bhushannegi333.github.io/mcs232/)

> **IGNOU MCA MCSP-232 Major Project**  
> Student: **Bharatbhushan Negi** | Enrolment: **2452099854**  
> Guide: Priyanshu Negi | Session: April 2026 – June 2026

---

## 📋 Project Overview

**Banjare** is a full-stack web application that serves as a digital marketplace for Uttarakhand travel services. It connects three stakeholders:

| Role | Description |
|------|-------------|
| 🧳 **Traveler** | Search, book & pay for vehicles and tour packages |
| 🚗 **Vehicle Owner** | List vehicles, manage bookings, track earnings |
| 🛡️ **Admin** | Approve listings, manage users, view analytics |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express.js | REST API Server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Authentication & Security |
| Razorpay SDK | Payment Gateway |
| Nodemailer | Email Notifications |
| Helmet, CORS, express-rate-limit | Security Middleware |
| Multer | File Uploads |

### Frontend
| Technology | Purpose |
|-----------|---------|
| HTML5 + CSS3 + JavaScript (ES6+) | Frontend |
| Bootstrap 5.3 | Responsive UI Framework |
| Font Awesome 6 | Icon Library |
| Chart.js | Dashboard Analytics Charts |

---

## 📁 Project Structure

```
banjare/
├── backend/
│   ├── server.js                  # Express server entry point
│   ├── package.json
│   ├── .env.example               # Environment variables template
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Profile
│   │   ├── vehicleController.js   # Vehicle CRUD
│   │   ├── bookingController.js   # Booking + price calc
│   │   ├── paymentController.js   # Razorpay integration
│   │   └── adminController.js     # Admin operations
│   ├── middleware/
│   │   └── auth.js                # JWT protect + authorize
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Vehicle.js             # Vehicle schema
│   │   ├── Tour.js                # Tour package schema
│   │   ├── Booking.js             # Booking schema
│   │   └── PaymentReview.js       # Payment + Review schemas
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── tours.js
│   │   ├── bookings.js
│   │   ├── payments.js
│   │   ├── reviews.js
│   │   ├── admin.js
│   │   └── users.js
│   ├── services/
│   │   └── emailService.js        # Nodemailer templates
│   └── uploads/
│       └── vehicles/              # Uploaded vehicle images
│
└── frontend/
    ├── index.html                 # Homepage
    ├── css/
    │   └── main.css               # All styles
    ├── js/
    │   ├── api.js                 # Centralised API client
    │   └── main.js                # Homepage + shared JS
    └── pages/
        ├── login.html
        ├── register.html
        ├── vehicles.html          # Vehicle search & listing
        ├── vehicle-details.html   # Vehicle detail + booking
        ├── tours.html             # Tour packages listing
        ├── tour-details.html      # Tour detail + booking
        ├── dashboard.html         # Traveler dashboard
        ├── my-bookings.html       # Booking history
        ├── profile.html           # Profile management
        ├── owner-dashboard.html   # Owner panel
        ├── admin-dashboard.html   # Admin analytics panel
        ├── admin-listings.html    # Approve/reject listings
        ├── admin-users.html       # User management
        └── about.html / contact.html
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+ and npm
- MongoDB (local) or MongoDB Atlas account
- Razorpay account (test mode keys)
- Gmail account (for Nodemailer)

### Step 1 – Clone / Download Project
```bash
cd banjare/backend
```

### Step 2 – Install Backend Dependencies
```bash
npm install
```

### Step 3 – Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your values
```

Required `.env` values:
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/banjare
JWT_SECRET=your_super_secret_key
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXX
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

### Step 4 – Create Uploads Directory
```bash
mkdir -p uploads/vehicles
```

### Step 5 – Start the Backend Server
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```
Server runs at: **http://localhost:5000**

### Step 6 – Run the Frontend
Open `frontend/index.html` in a browser, or use Live Server (VS Code):
```bash
# Using Python
cd frontend
python -m http.server 3000
```
Frontend at: **http://localhost:3000**

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/update-profile` | Update profile | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |
| POST | `/api/auth/forgot-password` | Send reset email | ❌ |
| POST | `/api/auth/reset-password` | Reset with token | ❌ |

### Vehicles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | List/search vehicles | ❌ |
| GET | `/api/vehicles/:id` | Vehicle details | ❌ |
| GET | `/api/vehicles/my-listings` | Owner's vehicles | Owner |
| POST | `/api/vehicles` | Create listing | Owner |
| PUT | `/api/vehicles/:id` | Update listing | Owner |
| DELETE | `/api/vehicles/:id` | Delete listing | Owner |

### Bookings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bookings` | Create booking | User |
| GET | `/api/bookings` | My bookings | User |
| GET | `/api/bookings/owner` | Owner bookings | Owner |
| GET | `/api/bookings/:id` | Booking detail | User |
| PUT | `/api/bookings/:id/cancel` | Cancel booking | User |
| GET | `/api/bookings/calculate-price` | Price preview | ❌ |

### Payments (Razorpay)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/create-order` | Create Razorpay order | User |
| POST | `/api/payments/verify` | Verify payment signature | User |
| GET | `/api/payments/my` | Payment history | User |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Analytics stats | Admin |
| GET | `/api/admin/pending-listings` | Pending approvals | Admin |
| PUT | `/api/admin/approve/vehicle/:id` | Approve vehicle | Admin |
| DELETE | `/api/admin/reject/vehicle/:id` | Reject vehicle | Admin |
| GET | `/api/admin/users` | All users | Admin |
| PUT | `/api/admin/users/:id/toggle-block` | Block/unblock user | Admin |
| GET | `/api/admin/bookings` | All bookings | Admin |

---

## 💳 Razorpay Payment Flow

```
1. User clicks "Book Now & Pay"
2. Frontend → POST /api/bookings → Creates pending booking
3. Frontend → POST /api/payments/create-order → Gets Razorpay order_id
4. Razorpay Checkout Widget opens in browser
5. User pays (UPI / Card / Net Banking)
6. Razorpay returns: razorpay_order_id, razorpay_payment_id, razorpay_signature
7. Frontend → POST /api/payments/verify
8. Backend verifies HMAC-SHA256 signature
9. Booking status updated to 'confirmed'
10. Confirmation email sent via Nodemailer
```

**Test credentials:**
- Card: `4111 1111 1111 1111` | Exp: any future | CVV: any 3 digits
- UPI: `success@razorpay`

---

## 🗄️ Database Schema Summary

### Users Collection
```json
{
  "name": "String (required)",
  "email": "String (unique, required)",
  "passwordHash": "String (bcrypt, select:false)",
  "role": "enum[user, owner, admin]",
  "phone": "String",
  "isActive": "Boolean (default: true)"
}
```

### Vehicles Collection
```json
{
  "ownerId": "ObjectId → Users",
  "make": "String", "model": "String", "year": "Number",
  "vehicleType": "enum[sedan, suv, innova, tempo-traveller, ...]",
  "seats": "Number", "pricePerDay": "Number (min: 500)",
  "city": "String (indexed)", "features": "[String]",
  "isApproved": "Boolean (default: false)",
  "rating": "Number (0-5)"
}
```

### Bookings Collection
```json
{
  "userId": "ObjectId → Users",
  "vehicleId": "ObjectId → Vehicles",
  "startDate": "Date", "endDate": "Date",
  "baseAmount": "Number", "taxAmount": "Number",
  "serviceCharge": "Number", "totalPrice": "Number",
  "status": "enum[pending, confirmed, cancelled, completed]"
}
```

---

## 🧪 Test Cases Summary

| Module | Test | Expected | Status |
|--------|------|----------|--------|
| Auth | Register valid user | 201 + JWT | ✅ Pass |
| Auth | Duplicate email | 400 error | ✅ Pass |
| Auth | Wrong password | 401 error | ✅ Pass |
| Auth | Expired token | 401 error | ✅ Pass |
| Vehicle | List approved | 200 + array | ✅ Pass |
| Vehicle | Create as owner | 201 pending | ✅ Pass |
| Vehicle | Create as traveler | 403 forbidden | ✅ Pass |
| Booking | Create with valid data | 201 + order_id | ✅ Pass |
| Booking | Date conflict | 409 conflict | ✅ Pass |
| Booking | Tampered signature | 400 error | ✅ Pass |
| Admin | Approve vehicle | 200 + approved | ✅ Pass |
| System | End-to-end booking | Full flow | ✅ Pass |
| System | Rate limiting (>100 req) | 429 response | ✅ Pass |
| System | NoSQL injection | Sanitised | ✅ Pass |

---

## 🚀 Deployment Guide

### Backend → Render.com
1. Push backend/ to GitHub
2. Create new Web Service on render.com
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all environment variables from `.env`

### Frontend → Vercel / Netlify
1. Push frontend/ to GitHub
2. Import repository on vercel.com
3. Set root directory to `frontend/`
4. Update `API_BASE` in `js/api.js` to backend URL

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Add IP whitelist: `0.0.0.0/0`
3. Create database user
4. Copy connection string to `MONGO_URI`

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 12 salt rounds |
| JWT Authentication | HS256 signed, 24h expiry |
| Role-Based Access | Admin / Owner / User middleware guards |
| Rate Limiting | 100 req/15min general, 10/15min for auth |
| NoSQL Injection Prevention | express-mongo-sanitize |
| XSS Protection | Helmet.js security headers |
| Payment Security | Razorpay HMAC-SHA256 signature verification |
| Input Validation | express-validator on all routes |
| CORS | Whitelisted origins only |

---

## 📞 Contact

**Bharatbhushan Negi**  
Enrolment: 2452099854  
Vill/Post – Bawai, Dist – Rudraprayag, Pin – 246442, Uttarakhand  
📧 bhushannegi333@gmail.com | 📱 9557166769

**Guide: Priyanshu Negi**  
Sr. Software Engineer | UKG, Noida  
📧 Priyanshu.negi17@gmail.com

---

*IGNOU MCA (MCAOL) | MCSP-232 Major Project | May 2026*

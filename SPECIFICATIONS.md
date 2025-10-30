# High-Level Project Specification: KINKLY Event Platform (v3)

## 1. Project Vision

To create a luxurious, mystical user experience for an exclusive, high-end event series in the kink scene. The platform must convey elegance and exclusivity through minimal design, while leveraging psychological triggers like FOMO (Fear Of Missing Out) and scarcity to motivate a discerning, affluent audience. The entire user journey, from landing on the page to post-purchase, must feel like a seamless, premium, and secretive experience.

**Status: LIVE-READY** ✅ - All core features implemented and deployed

**Latest Update:** Database migrated to Supabase, Resend email configuration in progress

---

## 2. Core User Flow: The Golden Path (For Users with a Referral Code)

This is the primary journey for an invited guest.

### Step 1: The Gate (Elite Passcode Entry) ✅ IMPLEMENTED

The user lands on a page that is intentionally sparse and mysterious. The only immediate action is to prove their right to enter.

**UI Implementation:**
- **Logo:** "K" in Cormorant SemiBold font with solid white fill
- **Title:** "DER SCHLÜSSEL, BITTE." (German) / "THE KEY, PLEASE." (English)
- **Input:** Elite Passcode field (formerly Referral Code)
- **Button:** "EINTRETEN" (German) / "ENTER" (English)
- **Fallback:** "Kein Token? Warteliste beitreten" / "No token? Join the waitlist"

**Enhanced Pre-Landing Flow:**
- **Two-Step Process:** Code validation → Email/Name capture modal
- **Required Fields:** First name, last name, email (all mandatory)
- **Consent Checkbox:** Privacy policy agreement required
- **Double Opt-In:** Email verification sent after form submission
- **Soft Gate:** Verification banner on event page for unverified users
- **Language Persistence:** Selected language (EN/DE) saved in localStorage

- **Action:** User enters their Elite Passcode and clicks "EINTRETEN".
- **Backend:** `POST /api/auth/validate-code`. The backend validates the code, checking its validity, usage count, expiration, and IP/session-based limits.
- **Success:** If the code is valid, the user is granted access and redirected to the event page.
- **Failure:** If the code is invalid, error message appears (e.g., "Der Elite Passcode passt nicht.").
- **Session Management:** IP/session-based tracking prevents code abuse.

### Step 2: The Sanctum (The Event Unveiled) ✅ IMPLEMENTED

Once access is granted, the user sees the full landing page with three membership tiers.

- **FOMO & Scarcity Elements:**
    - **Live Ticket Counter:** Displays remaining tickets with dynamic animations:
        - **≤3 Plätze:** Red, pulsing, warning emoji, larger text
        - **≤6 Plätze:** Orange, highlighted
        - **>6 Plätze:** Yellow, normal
        - **Ring Effect:** Visual focus on low-stock tiers
        - **Bounce Animation:** Critical stock alerts
    - **Backend:** `GET /api/events/status` provides real-time ticket counts
    - **Frontend:** Auto-refreshes every 30 seconds
    - **Three Tiers:** The Invitation (€995), The Circle (€2,000), The Inner Sanctum (€10,000)

### Step 3: The Commitment (Payment & Data Collection) ✅ IMPLEMENTED

- **Action:** User selects a ticket tier and fills out the ticket form with separate first/last name fields.
- **Form Data Transfer:** Pre-filled data from landing page (if coming from preloader)
- **Backend:** `POST /api/applications` creates application record
- **Payment Options:** Stripe and PayPal integration
- **Elite Passcode Tracking:** Code usage counted only on successful purchase (not validation)
- **Session Management:** IP/session-based limits prevent abuse

### Step 4: The Affirmation (Confirmation & Onboarding) ✅ IMPLEMENTED

- **Action:** After successful payment, user sees success animation
- **UI:** The `SuccessAnimation` component displays confirmation
- **Backend Trigger:** Stripe/PayPal webhooks (`POST /api/stripe-webhook`, `POST /api/paypal/capture-order`) process payments
- **Email System:** Automatic confirmation emails via Resend
- **Ticket Reduction:** Remaining tickets automatically updated
- **Referral Tracking:** Elite Passcode usage incremented on successful purchase

---

## 3. Secondary User Flow: The Waiting List (For Users without a Code) ✅ IMPLEMENTED

### Cross-Project Integration: Landing Page + Event Page

**Landing Page (kinkly-preloader):**
- **Two-Step Process:** First Elite Passcode entry, then waitlist details
- **Token Validation:** Direct validation and redirect to event page
- **Waitlist Form:** First name, last name, email, optional Elite Passcode
- **Email Detection:** Automatic recognition of existing emails with auto-fill
- **Styling:** Anthracite buttons instead of white, English/German support

**Event Page Integration:**
- **Data Transfer:** Form data transferred via localStorage
- **URL Parameters:** Elite Passcode passed via `?elitePasscode=CODE`
- **Session Storage:** Token stored for session persistence

**Backend Integration:**
- **API Endpoint:** `POST /api/waitlist` stores waitlist entries
- **Database:** `waitlist` table with first_name, last_name, email, referral_code
- **Email System:** Admin can send event invitations to waitlist members

---

## 4. Admin Panel & Advanced Features ✅ IMPLEMENTED

A comprehensive, JWT-protected admin area with full CRUD operations.

### 4.1. User & Elite Passcode Management ✅ IMPLEMENTED
- **Admins can:**
    - **Create Users:** Add new users with optional tier assignment or waitlist placement
    - **Edit Users:** Update user details, status, and tier assignments
    - **Delete Users:** Super admin can delete users (DELETE /api/admin/users/:id)
    - **View Users:** Separate first/last name display, status tracking
    - **Create Elite Passcodes:** Generate codes with format `[WORD][THREE_DIGITS]` (e.g., `LATEX777`)
    - **Free Codes:** Create codes without initial user assignment for later distribution
    - **Configure Tokens:** Set max uses, expiration dates, referrer assignment
    - **Token Management:** Edit, deactivate, and track usage counts
    - **Referrer Display:** Show referrer names instead of IDs
    - **Code Assignment:** Assign free codes to waitlist members

### 4.2. Waitlist Management ✅ IMPLEMENTED
- **Admins can:**
    - **View Waitlist:** See all waitlist entries with timestamps
    - **Send Invitations:** Email event invitations to waitlist members
    - **Assign Codes:** Assign free referral codes to waitlist members
    - **Filter Codes:** Toggle between all codes and free codes only
    - **Refresh Data:** Manual refresh of waitlist and code data
    - **Cross-Reference:** Check if emails exist in applications or waitlist

### 4.3. Event & Scarcity Management ✅ IMPLEMENTED
- **Admins can:**
    - **Real-Time Sync:** View current ticket counts for all three tiers
    - **Manual Adjustment:** Update ticket availability for each tier
    - **Live Updates:** Changes reflect immediately in frontend counters
    - **Status Display:** Current availability shown in admin interface

### 4.4. Analytics Dashboard ✅ IMPLEMENTED
- **Admins can:**
    - **Revenue Tracking:** Total revenue from all successful payments
    - **Application Stats:** Pending payments, reviews, approvals
    - **Debug Logging:** Comprehensive logs for troubleshooting
    - **Payment Monitoring:** Stripe and PayPal transaction tracking

---

## 5. Technology Stack & Architecture ✅ IMPLEMENTED

- **Frontend:** React, TypeScript, Vite, Context API
- **Backend:** Node.js, Express.js, PostgreSQL
- **Database:** **PostgreSQL hosted on Supabase** (Production-ready, migrated from Render)
- **Deployment:** Vercel (Frontend), Render (Backend), Supabase (Database)
- **Payments:** Stripe Checkout + PayPal integration
- **Transactional Emails:** **Resend** (Production-ready)
- **Authentication:** JWT tokens for admin access
- **Session Management:** IP/session-based tracking
- **Cross-Project:** Two separate Vercel deployments with shared database

### 5.1. Database Schema ✅ IMPLEMENTED
- **applications:** User applications with separate first/last names
- **payments:** Payment records linked to applications
- **referral_codes:** Elite passcodes with usage tracking
- **referral_code_usage:** IP/session-based usage tracking
- **event_settings:** Ticket availability and scarcity management
- **waitlist:** Cross-project waitlist integration
- **prospects:** Pre-landing form data with email verification
- **email_verifications:** Double opt-in verification tokens
- **users:** Admin and user accounts with role-based access
- **magic_links:** Session management for admin login

---

## 6. Legal & Compliance ✅ IMPLEMENTED

- **Cookie Consent:** Custom cookie consent banner with modal integration
- **Privacy Policy:** Comprehensive Datenschutz with K | PRODUKTION details
- **Terms & Conditions:** AGB with exclusive club recording policies
- **Impressum:** Complete legal information for K | PRODUKTION
- **GDPR Compliance:** User rights, data retention, complaint procedures
- **Cross-Project Legal:** Consistent legal framework across both sites

### 6.1. Exclusive Club Policies ✅ IMPLEMENTED
- **Recording Policy:** Cameras must be surrendered at entrance
- **Circle Communication:** Special devices without photo/video capability
- **Professional Documentation:** Masked and unidentifiable only
- **Privacy Protection:** No personal identification in recordings

---

## 7. Recent Updates & Enhancements ✅ IMPLEMENTED

### 7.1. UI/UX Improvements
- **Cookie Banner:** Fixed "Mehr erfahren" link to open Datenschutz modal
- **Ticket Animations:** Dynamic visual feedback for low stock (≤3, ≤6, >6)
- **Scarcity Management:** Real-time sync between admin panel and frontend
- **Form Data Transfer:** Seamless data flow from landing page to event page

### 7.2. Backend Optimizations
- **Debug Logging:** Comprehensive logging for payment processing and analytics
- **Session Management:** IP/session-based Elite Passcode usage tracking
- **Waitlist Integration:** Cross-project database synchronization
- **Email System:** Production-ready Resend integration

### 7.3. Admin Panel Enhancements
- **User Management:** Separate first/last name fields, optional tier assignment
- **Elite Passcode Management:** Full CRUD operations with usage tracking
- **Analytics Dashboard:** Real-time revenue and application statistics
- **Waitlist Management:** Email invitation system for waitlist members

### 7.4. Cross-Project Integration
- **Landing Page:** Two-step process (token → details) with anthracite styling
- **Event Page:** URL parameter handling and session storage
- **Database:** Shared Supabase PostgreSQL instance for both projects
- **API Integration:** Unified backend serving both frontends
- **Email Verification:** Double opt-in flow with soft-gate banner
- **Language Persistence:** EN/DE selection saved across page reloads

---

## 8. Deployment Status ✅ LIVE

- **Frontend (Event Page):** https://kinkly-main.vercel.app
- **Frontend (Landing Page):** https://kinkly-preloader.vercel.app  
- **Backend:** https://kinkly-backend.onrender.com
- **Database:** Supabase PostgreSQL (Production, migrated from Render)
- **Email Service:** Resend (Production, domain verification in progress)
- **Payment Processing:** Stripe + PayPal (Production)

**All systems operational and ready for production use.** 🚀

---

## 5.2. Email Sending Configuration (Resend + DNS for kinkly.eu)

To ensure reliable delivery and prevent “The recipient's mail server permanently rejected the email.” errors, the domain `kinkly.eu` must be verified in Resend and have proper DNS records (SPF/DKIM) configured at the DNS provider (Strato).

### Required Environment Variables (Backend)
- `RESEND_API_KEY` → API key from Resend
- `EMAIL_FROM` → `waitlist@kinkly.eu` (must be on the verified domain)

### Resend Domain Setup
1. Open Resend → Domains → Add Domain → enter `kinkly.eu`.
2. Copy the DNS records (TXT for domain verification, SPF, DKIM).
3. Add these records at your DNS provider (Strato). Wait for verification to turn green in Resend.

### Strato DNS – Where to add records
- Log in to Strato → Domains → verwalten → DNS Einstellungen.
- Add the following records (values come from Resend domain page):
  - TXT (root `@`): Resend verification TXT value
  - TXT (SPF at root `@`): `v=spf1 include:resend.com ~all`
  - CNAME (Host `resend._domainkey`): DKIM target provided by Resend

Notes:
- DNS propagation can take 5–60 minutes. Verify status in Resend.
- `EMAIL_FROM` must use the verified domain, e.g., `waitlist@kinkly.eu`.
- After DNS is verified, re‑test sending (waitlist and admin “Send Invite”).

---

## 9. Future Enhancements & TODOs

### 9.1. E-Mail-Strategie & Automation ✅ IN PROGRESS
- **E-Mail-Architektur implementieren:**
  - `waitlist@kinkly.eu` → Waitlist und System-E-Mails (CURRENT)
  - `circle@kinkly.eu` → Circle-Mitglieder Bestätigungen
  - `events@kinkly.eu` → Event-Updates für alle Interessenten  
  - `kontakt@kinkly.eu` → Business-Kommunikation nach außen
- **Resend-Konfiguration** für kinkly.eu Domain (DNS setup in progress)
- **E-Mail-Automation** für Circle-Journey (Waitlist → Circle → Events)
- **Business-E-Mail-Templates** für externe Partner-Kommunikation

### 9.2. DSGVO-Compliance ✅ IMPLEMENTED
- [x] Cookie-Consent Banner (Custom implementation)
- [x] Datenschutz-Seite (Comprehensive with K | PRODUKTION details)
- [x] AGB-Seite (With exclusive club recording policies)
- [x] Impressum (Complete legal information for K | PRODUKTION)

### 9.3. Erweiterte Admin-Features ✅ PARTIALLY IMPLEMENTED
- [x] E-Mail-Kampagnen-System (Waitlist invitations, admin send invites)
- [x] Erweiterte Analytics und Berichte (Revenue tracking, application stats)
- [x] Bulk-Operations für Benutzer (User management, code assignment)
- [ ] Audit-Log für Admin-Aktionen

### 9.4. Benutzer-Experience ✅ PARTIALLY IMPLEMENTED
- [x] Erweiterte Animationen und Übergänge (K-Logo animation, ticket counters, success animations)
- [x] Mobile-Optimierung verfeinern (Responsive design, mobile-first approach)
- [x] Loading-States verbessern (Preloader, form states, admin panel)
- [x] Error-Handling optimieren (Server error display, validation messages)

### 9.5. Technische Verbesserungen ✅ PARTIALLY IMPLEMENTED
- [x] Performance-Optimierung (Database migration to Supabase, optimized queries)
- [x] Code-Refactoring (Modular components, clean architecture)
- [ ] Unit-Tests hinzufügen
- [x] Monitoring und Logging (Comprehensive backend logging, error tracking)

### 9.7. Launch Checklist (Sicherheit)
- [ ] Form‑Guards (Honeypot + Time‑Trap) wieder aktivieren
- [ ] Turnstile/hCaptcha Server‑Verifikation aktivieren (ENV: TURNSTILE_SECRET)
- [ ] Rate‑Limits prüfen/anpassen (auth/waitlist/applications/validate-code)
- [ ] CORS nur auf produktive Domains beschränken (kinkly.eu, www.kinkly.eu)

### 9.6. Erweiterte Features ✅ PARTIALLY IMPLEMENTED
- [x] Multi-Event-Support (Event settings table, scalable architecture)
- [x] Erweiterte Zahlungsoptionen (Stripe + PayPal integration)
- [ ] Social-Media-Integration
- [ ] Push-Notifications

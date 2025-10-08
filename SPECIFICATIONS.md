# High-Level Project Specification: KINKLY Event Platform (v2)

## 1. Project Vision

To create a luxurious, mystical user experience for an exclusive, high-end event series in the kink scene. The platform must convey elegance and exclusivity through minimal design, while leveraging psychological triggers like FOMO (Fear Of Missing Out) and scarcity to motivate a discerning, affluent audience. The entire user journey, from landing on the page to post-purchase, must feel like a seamless, premium, and secretive experience.

---

## 2. Core User Flow: The Golden Path (For Users with a Referral Code)

This is the primary journey for an invited guest.

### Step 1: The Gate (Code Entry)

The user lands on a page that is intentionally sparse and mysterious. The only immediate action is to prove their right to enter. A placeholder logo will be used initially.

**UI Mock: Initial View**
[Placeholder Logo/Symbol]

  DER SCHLÜSSEL, BITTE.

  [___________________]  (Input field for code)
       [ EINTRETEN ]       (Submit button)

Eine Einladung anfragen (Subtle text link below the button)

- **Action:** User enters their Referral Code and clicks "EINTRETEN".
- **Backend:** `POST /api/auth/validate-code`. The backend validates the code, checking its validity, usage count, and expiration.
- **Success:** If the code is valid, the user is granted access. The "Gate" UI elegantly fades or animates away, revealing "The Sanctum".
- **Failure:** If the code is invalid, a subtle, non-disruptive error message appears (e.g., "Der Schlüssel passt nicht.").
- **Exclusivity:** The "Gate" will always be enforced for any user who has not been previously validated. Direct links to internal pages will still require code entry.

### Step 2: The Sanctum (The Event Unveiled)

Once access is granted, the user sees the full landing page.

- **FOMO & Scarcity Elements:**
    - **Live Ticket Counter:** Displays remaining tickets. E.g., *"Nur noch 17 Plätze verfügbar."*
        - **Backend:** `GET /api/events/status` provides ticket counts.
        - **Frontend:** Polls this endpoint periodically.
    - **Live Activity Feed:** A subtle, temporary notification appears.
        - **Text Mock:** *"Ein Platz im inneren Kreis wurde soeben besetzt."*
        - **Display Logic:** The notification will be a small banner at the bottom of the screen, visible for a few seconds. To maintain authenticity, it will appear at most once every few minutes.

### Step 3: The Commitment (Payment & Data Collection)

- **Action:** User selects a ticket tier and clicks to purchase.
- **Backend:** `POST /api/payments/create-checkout-session`, passing the tier and referral code.
- **Redirect to Stripe:** The backend redirects the user to a Stripe Checkout Session.
    - **Data Collection:** Stripe collects Name, Email, and Payment Information.
    - **Referral Code Tracking:** The code is passed to Stripe as metadata.

### Step 4: The Affirmation (Confirmation & Onboarding)

- **Action:** After successful payment, Stripe redirects the user to `/success`.
- **UI:** The `SuccessAnimation` component is displayed with a confirmation message.
    - **Text Mock:** *"Willkommen im inneren Kreis. Ihre Reise beginnt."*
- **Backend Trigger:** A Stripe Webhook (`POST /api/webhooks/stripe`) receives the `checkout.session.completed` event. The backend then creates User and Ticket records and triggers a confirmation email via Resend.

---

## 3. Secondary User Flow: The Waiting List (For Users without a Code)

- **Action:** On "The Gate" page, a user clicks "Eine Einladung anfragen".
- **UI:** A modal or section appears.
    - **Text Mock:**
    ```
    HINTERLASSEN SIE IHRE KARTE.

    Sollte ein Platz frei werden oder eine neue Soiree bevorstehen,
    könnten die Auserwählten eine Einladung erhalten.

    [ E-Mail-Adresse eintragen ]
           [ ANFRAGEN ]
    ```
- **Backend:** The email is sent to `POST /api/waitlist` and stored.
- **Confirmation Message (UI):** Upon submission, the user sees: *"Welcome to the Circle. You are now on the waitlist. The invitation will follow."*

---

## 4. Admin Panel & Advanced Features

A simple, password-protected admin area will be created.

### 4.1. User & Referral Code Management
- **Admins can:**
    - Create, view, and manage Users (Werber).
    - Create and assign Referral Codes to a specific User.
    - **Configure Codes:** For each code, an admin can set:
        - `maxUses`: How many times the code can be used (e.g., 1, 10, or unlimited).
        - `expiresAt`: An optional expiration date for the code.
- **Code Generation:** Codes will follow the format `[KINKY_WORD][THREE_DIGITS]` (e.g., `LATEX777`), using a placeholder list of words for now.

### 4.2. Event & Scarcity Management
- **Admins can:**
    - Manually adjust the `tier1_sold` and `tier2_sold` counts for each event to control perceived scarcity.

---

## 5. Technology Stack & Architecture

- **Frontend:** React, TypeScript, Vite, TanStack Query.
- **Backend:** Node.js, Express.js.
- **Database:** **PostgreSQL hosted on Render.** This is the agreed-upon cloud solution.
- **ORM:** **Prisma**.
- **Deployment:** Vercel (Frontend), Render (Backend & DB).
- **Payments:** Stripe (via Stripe Checkout).
- **Transactional Emails:** **Resend**.
- **Asset Note:** The project currently cannot access external assets from GitHub. All necessary assets (logos, images, etc.) must be provided or will be created as placeholders.

---

## 6. Legal & Compliance

- **Cookie Consent:** A `react-cookie-consent` banner will be implemented, styled to match the site's aesthetic and linking to the `Datenschutz` page.

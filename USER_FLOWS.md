## Kinkly – User Flows (Concise Sketch)

Purpose: Quick, structured overview you can import/recreate in a diagramming tool.

### Legend
- Start/End: rounded
- Decision: diamond
- Data store: cylinder
- Important params: `elitePasscode`, `email`, `verified`

---

### 1) Pre‑Landing – With Elite Passcode
Steps:
1. User lands on `/` (pre‑landing)
2. Enters `elitePasscode`
3. Validate via `/api/auth/validate-code`
4. Show capture modal (required: first name, last name, email, consent)
5. Create prospect via `/api/prospects`
6. Trigger verification mail via `/api/auth/request-email-verification`
7. Store `kinklyVerificationPending=1` and `kinklyFormData`
8. Redirect to `/event?elitePasscode=...`

Mermaid (paste into tools that support Mermaid):
```mermaid
flowchart TD
  A([Landing /]) --> B[Enter elitePasscode]
  B --> C{Validate code}
  C -- invalid --> E[Show error]
  C -- valid --> F[Capture: first, last, email, consent]
  F --> G[POST /api/prospects]
  G --> H[POST /api/auth/request-email-verification]
  H --> I[localStorage: pending + formData]
  I --> J([Redirect /event?elitePasscode=...])
```

---

### 2) Pre‑Landing – No Code (Waitlist)
Steps:
1. From `/` switch to Waitlist
2. Required: first name, last name, email, consent
3. Save via `/api/waitlist`
4. Optional: later invite or magic‑link login

```mermaid
flowchart TD
  A([Landing /]) --> B[Switch to Waitlist]
  B --> C[Enter first, last, email, consent]
  C --> D[POST /api/waitlist]
  D --> E([Done / Thank you])
```

---

### 3) Email Verification Flow (Double Opt‑In)
Steps:
1. Backend creates token in `email_verifications`
2. Email contains link to `/api/auth/verify-email?token=...&redirect=...`
3. On click: token validated → mark verified → redirect to `/event`

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant BE as Backend
  participant Mail as Email Provider
  UI->>BE: POST /api/auth/request-email-verification (email)
  BE->>Mail: Send verification link
  Mail-->>User: Verification email
  User->>BE: GET /api/auth/verify-email?token=...
  BE-->>UI: 302 Redirect /event (verified)
```

---

### 4) Event Page – Soft Gate
Behavior:
- If `kinklyVerificationPending=1`: show banner with email, actions: Resend, Login, Close.
- Browsing allowed; actions like Ticket/Profil weiter via Login/Magic‑Link.

```mermaid
flowchart TD
  A([/event]) --> B{localStorage pending?}
  B -- yes --> C[Show verification banner]
  B -- no --> D[No banner]
  C --> E[Resend verification]
  C --> F[Login (Magic Link)]
  C --> G[Dismiss]
```

---

### 5) Login via Magic Link
Steps:
1. Request link: `POST /api/auth/request-magic-link` (email, redirect)
2. Click link: `GET /api/auth/magic-login?token=...` → sets session cookie → redirect `/event`

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant BE as Backend
  participant Mail as Email Provider
  UI->>BE: POST /api/auth/request-magic-link
  BE->>Mail: Send magic link
  Mail-->>User: Magic link email
  User->>BE: GET /api/auth/magic-login?token=...
  BE-->>UI: 302 Redirect /event (session set)
```

---

### 6) Referral Code/Ticket Flow (Event‑Seite)
Steps:
1. User klickt „Request Ticket“ / wählt Tier
2. Referral Code Modal (falls nötig) → TicketForm
3. Submit Application `/api/applications` (resolves `elitePasscode` → `referral_code_id`)
4. Payment: Stripe/PayPal
5. On success: `payments` insert, `applications.status=pending_review`, decrement tier stock
6. Confirmation mail

```mermaid
flowchart TD
  A([Event]) --> B[Select tier]
  B --> C[Referral Code / TicketForm]
  C --> D[POST /api/applications]
  D --> E{Payment Stripe/PayPal}
  E -->|success| F[Record payment + decrement stock]
  F --> G[Send confirmation mail]
  G --> H([Done])
  E -->|fail| I[Show error / retry]
```

---

### 7) Resend Verification (New Device or Missed Mail)
Options:
- Banner „Mail erneut senden“ → `POST /api/auth/request-email-verification`
- Kein Banner sichtbar: Login‑Button im Header oder kleiner Link „Verifizierungs‑Mail erneut senden“ (empfohlen)

---

### 8) Admin (Kurz)
- Login (separat)
- Dashboard: Users, Referral Codes, Scarcity, Waitlist
- Actions: Assign code to waitlist, send invite, adjust scarcity

---

## Tool‑Vorschläge (Online)
- Miro (Flowchart, Swimlanes, Mermaid Widget optional)
- Whimsical (schnelle User Flows/Wireflows)
- FigJam (Figma) – Teamfreundlich, Sticky‑notes + Shapes
- diagrams.net (draw.io) – kostenlos, Export nach SVG/PNG
- Mermaid Live Editor – für die Code‑Snippets oben (`https://mermaid.live`)

Tipps:
- Nutze Swimlanes: Frontend / Backend / Email
- Nutze eindeutige Statusnamen: `pending_verification`, `pending_review`, `approved`



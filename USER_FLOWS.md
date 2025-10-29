## Kinkly – Unified User Flow (Single Mermaid Block)

Paste this as‑is into Mermaid Live, Miro, FigJam, draw.io or any Mermaid‑capable tool.

```mermaid
flowchart TD
  %% Global notes
  %% Important params: elitePasscode, email, verified; localStorage keys: kinklyVerificationPending, kinklyFormData

  %% Entry
  LND([User lands on / (Pre‑Landing)])

  %% Pre‑Landing with Code
  LND --> PLC[Enter elitePasscode]
  PLC --> VAL{POST /api/auth/validate-code}
  VAL -- invalid --> PLC_ERR[Show error]
  VAL -- valid --> CAP[Capture first, last, email, consent]
  CAP --> PROS[POST /api/prospects]
  PROS --> VERQ[POST /api/auth/request-email-verification]
  VERQ --> LSP[Set localStorage: pending + formData]
  LSP --> RED1([Redirect to /event?elitePasscode=...])

  %% Pre‑Landing without Code (Waitlist)
  LND --> WL[Switch to Waitlist]
  WL --> WLF[Enter first, last, email, consent]
  WLF --> WLS[POST /api/waitlist]
  WLS --> WL_OK([Done / Thank you])

  %% Event soft gate
  EVT([/event])
  RED1 --> EVT
  LND -. direct nav .-> EVT
  EVT --> PND{localStorage pending?}
  PND -- yes --> BAN[Show verification banner]
  PND -- no --> NOBAN[No banner]

  %% Banner actions
  BAN --> RESEND[POST /api/auth/request-email-verification]
  BAN --> LOGIN[Open Login (Magic Link)]
  BAN --> CLOSE[Dismiss]

  %% Magic link login
  LOGIN --> ML_REQ[POST /api/auth/request-magic-link]
  ML_REQ --> ML_MAIL[[Email: Magic link]]
  ML_MAIL --> ML_CLICK[GET /api/auth/magic-login?token=...]
  ML_CLICK --> EVT

  %% Email verification
  VER[[Email: Verification link]]
  VERQ --> VER
  VER --> VCLICK[GET /api/auth/verify-email?token=...]
  VCLICK --> EVT

  %% Ticketing
  NOBAN --> TIER[Select tier]
  BAN --> TIER
  TIER --> FORM[Referral Code / TicketForm]
  FORM --> APP[POST /api/applications]
  APP --> PAY{Payment: Stripe | PayPal}
  PAY -- success --> REC[Record payment + decrement stock]
  REC --> CONF[[Email: Confirmation]]
  CONF --> DONE([Done])
  PAY -- fail --> RETRY[Show error / retry]

  %% Admin (overview)
  ADM([/admin])
  ADM --> DASH[Dashboard: Users, Codes, Scarcity, Waitlist]
  DASH --> ACT1[Assign code to waitlist]
  DASH --> ACT2[Send invite]
  DASH --> ACT3[Adjust scarcity]
```

---

## Tool‑Vorschläge (Online)
- Miro (Flowchart, Swimlanes)
- Whimsical (User Flows)
- FigJam (Figma)
- diagrams.net (draw.io)
- Mermaid Live Editor: `https://mermaid.live`

---

## Einfache Version für Kund:innen (ohne Technik‑Begriffe)

1) Startseite (Einladung)
- Wenn jemand einen Einladungscode hat, gibt er ihn ein und nennt kurz seinen Namen und seine E‑Mail.
- Danach bekommt die Person eine Bestätigungs‑E‑Mail, um die E‑Mail‑Adresse zu bestätigen.
- Anschließend landet sie auf der Event‑Seite.

2) Startseite (ohne Einladungscode)
- Wer keinen Code hat, trägt sich mit Namen und E‑Mail auf die Warteliste ein.
- Wir melden uns, sobald eine Einladung frei wird.

3) E‑Mail‑Bestätigung
- In der E‑Mail ist ein Link zum Bestätigen. Ein Klick reicht.
- Nach der Bestätigung geht es automatisch weiter zur Event‑Seite.

4) Event‑Seite
- Die Seite zeigt Informationen zum Abend und die verfügbaren Plätze.
- Wer bereits bestätigt ist, kann sich anmelden und fortfahren.
- Wer noch nicht bestätigt ist, sieht einen kurzen Hinweis und kann die Bestätigungs‑Mail erneut anfordern.

5) Ticket anfragen / Teilnahme sichern
- Es wird die gewünschte Kategorie ausgewählt.
- Kurz die Kontaktdaten prüfen und Anfrage absenden.
- Danach kann direkt bezahlt werden (wie im Online‑Shop).
- Sobald die Zahlung geklappt hat, gibt es eine Bestätigung per E‑Mail und der Platz ist gesichert.

6) Für Einladungen und Empfehlungen
- Wer bereits Teil des Kreises ist, kann Einladungen verschicken.
- So kommen neue Gäste über persönliche Empfehlungen dazu.



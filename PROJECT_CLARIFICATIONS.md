# KINKLY BERLIN - Projektspezifikationen & Klärungsfragen

## Projektübersicht

**Kinkly Berlin** ist eine exklusive Event-Plattform für hochwertige Kink-Events in Berlin. Die Plattform soll eine luxuriöse, geheimnisvolle Benutzererfahrung schaffen, die Eleganz und Exklusivität durch minimales Design vermittelt und psychologische Trigger wie FOMO und Verknappung nutzt.

---

## 1. AKTUELLE PROJEKTSTRUKTUR

### Frontend (React/TypeScript)
- **Framework**: React 19.1.1 mit TypeScript
- **Build-Tool**: Vite
- **Styling**: Tailwind CSS (implizit durch Klassen)
- **Zahlungsintegration**: Stripe & PayPal
- **Sprachen**: Deutsch & Englisch (vollständig implementiert)

### Backend (Node.js/Express)
- **Server**: Express.js
- **Datenbank**: PostgreSQL (Render-hosted)
- **Zahlungen**: Stripe & PayPal SDK
- **E-Mail**: Resend (vorbereitet, aber noch nicht implementiert)

### Aktuelle Preisstruktur
- **Die Einladung**: €995
- **Die Schwarze Karte**: €2.000 (Featured)
- **Der Souverän**: €10.000

---

## 2. KLÄRUNGSFRAGEN

### A. Geschäftslogik & User Flow

**1. Referral Code System**
- ❓ **Soll das aktuelle "Gate"-System (Referral Code erforderlich) beibehalten werden?**
- ❓ **Wie sollen Referral Codes generiert und verwaltet werden?** (Aktuell: Placeholder "S7")
- ❓ **Sollen verschiedene Code-Typen existieren?** (z.B. Einmalcodes, Mehrfachcodes, VIP-Codes)
- ❓ **Wer darf Codes erstellen und verteilen?**

**2. Ticket-Verfügbarkeit & Scarcity**
- ❓ **Wie viele Tickets sollen pro Event und Tier verfügbar sein?**
- ❓ **Soll die "Live Ticket Counter" Funktion echt oder simuliert sein?**
- ❓ **Wie oft sollen "Live Activity Feed" Benachrichtigungen erscheinen?**

**3. Bewerbungsprozess**
- ❓ **Wer entscheidet über die Annahme/Ablehnung von Bewerbungen?**
- ❓ **Gibt es spezielle Kriterien für die Auswahl?**
- ❓ **Wie lange dauert der Review-Prozess?**
- ❓ **Soll es ein automatisches oder manuelles Approval-System geben?**

### B. Event-Management

**4. Event-Details**
- ❓ **Ist das Datum "6.-7. Dezember 2025, 21:00-21:00" korrekt?**
- ❓ **Wie oft finden Events statt?** (Spezifikation sagt "alle drei Monate")
- ❓ **Sollen mehrere Events parallel verwaltet werden können?**
- ❓ **Wo findet das Event statt?** (Aktuell: "wird nach Einladung bekannt gegeben")

**5. Inhalte & Kommunikation**
- ❓ **Welche konkreten Inhalte/Performances sind geplant?**
- ❓ **Wie detailliert sollen die Event-Beschreibungen sein?**
- ❓ **Sollen Bilder/Videos von vergangenen Events gezeigt werden?**

### C. Technische Implementierung

**6. Admin-Panel**
- ❓ **Welche Admin-Funktionen sind prioritär?**
- ❓ **Soll es verschiedene Admin-Rollen geben?** (Super-Admin, Event-Manager, etc.)
- ❓ **Wie soll die Admin-Authentifizierung funktionieren?**

**7. E-Mail-System**
- ❓ **Welche E-Mail-Templates werden benötigt?**
  - Bewerbungsbestätigung
  - Annahme/Ablehnung
  - Event-Erinnerungen
  - Weitere?
- ❓ **Soll es automatische E-Mail-Sequenzen geben?**

**8. Datenbank & Hosting**
- ❓ **Ist PostgreSQL auf Render die finale Lösung?**
- ❓ **Welche Backup-Strategie ist gewünscht?**
- ❓ **Sollen Analytics/Tracking implementiert werden?**

### D. Design & UX

**9. Branding & Assets**
- ❓ **Gibt es ein finales Logo/Branding?** (Aktuell: Placeholder)
- ❓ **Welche Farben/Fonts sind final?**
- ❓ **Sollen zusätzliche Bilder/Videos integriert werden?**

**10. Mobile Experience**
- ❓ **Wie wichtig ist die mobile Optimierung?**
- ❓ **Sollen mobile-spezifische Features implementiert werden?**

---

## 3. UI-TEXTENTWÜRFE & MOCKUPS

### A. Gate-System (Referral Code Entry)

```
┌─────────────────────────────────────────┐
│              [LOGO/SYMBOL]              │
│                                         │
│           DER SCHLÜSSEL, BITTE.         │
│                                         │
│    ┌─────────────────────────────────┐   │
│    │         [CODE EINGEBEN]         │   │
│    └─────────────────────────────────┘   │
│                                         │
│              [ EINTRETEN ]              │
│                                         │
│        Eine Einladung anfragen          │
│           (Subtle Link)                 │
└─────────────────────────────────────────┘
```

**Fehlermeldung**: "Der Schlüssel passt nicht."
**Erfolg**: Eleganter Übergang zur Hauptseite

### B. Waitlist-Modal

```
┌─────────────────────────────────────────┐
│        HINTERLASSEN SIE IHRE KARTE.     │
│                                         │
│   Sollte ein Platz frei werden oder     │
│   eine neue Soirée bevorstehen,         │
│   könnten die Auserwählten eine         │
│   Einladung erhalten.                   │
│                                         │
│    ┌─────────────────────────────────┐   │
│    │    [ E-Mail-Adresse eintragen ] │   │
│    └─────────────────────────────────┘   │
│                                         │
│              [ ANFRAGEN ]               │
└─────────────────────────────────────────┘
```

**Bestätigung**: "Willkommen im Kreis. Sie stehen nun auf der Warteliste. Die Einladung wird folgen."

### C. Hauptseite - FOMO Elemente

**Live Ticket Counter**:
```
┌─────────────────────────────────────────┐
│  🔥 Nur noch 17 Plätze verfügbar        │
└─────────────────────────────────────────┘
```

**Live Activity Feed** (Bottom Banner):
```
┌─────────────────────────────────────────┐
│  ✨ Ein Platz im inneren Kreis wurde    │
│     soeben besetzt.                     │
└─────────────────────────────────────────┘
```

### D. Ticket-Bewerbungsformular

```
┌─────────────────────────────────────────┐
│         EINE EINLADUNG ANFRAGEN         │
│                                         │
│  Bitte beachten Sie: Das Absenden Ihrer │
│  Anfrage und Zahlung ist eine Bewerbung.│
│  Es garantiert keinen Eintritt. Die     │
│  endgültige Bestätigung wird nur vom    │
│  Zirkel erteilt. Nicht erfolgreiche     │
│  Bewerbungen werden vollständig         │
│  zurückerstattet.                       │
│                                         │
│  Vollständiger Name:                    │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  E-Mail:                                │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Warum möchten Sie teilnehmen?          │
│  (Optional)                             │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  │                                     │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│         [ EINLADUNG ANFRAGEN ]          │
└─────────────────────────────────────────┘
```

### E. Erfolgsbestätigung

```
┌─────────────────────────────────────────┐
│              ✨ ANIMATION ✨            │
│                                         │
│           ANFRAGE ERHALTEN              │
│                                         │
│     Wenn Sie auserwählt sind,           │
│     wird der Schlüssel Sie finden.      │
│                                         │
│              [ VERSTANDEN ]             │
└─────────────────────────────────────────┘
```

---

## 4. TECHNISCHE SPEZIFIKATIONEN

### A. Erforderliche API-Endpunkte

**Bereits implementiert**:
- `POST /api/applications` - Bewerbung erstellen
- `POST /api/create-payment-intent` - Stripe Payment
- `POST /api/paypal/create-order` - PayPal Order
- `POST /api/paypal/capture-order` - PayPal Capture
- `POST /api/stripe-webhook` - Stripe Webhooks

**Noch zu implementieren**:
- `POST /api/auth/validate-code` - Referral Code Validierung
- `POST /api/waitlist` - Waitlist-Eintrag
- `GET /api/events/status` - Ticket-Verfügbarkeit
- `GET /api/admin/*` - Admin-Panel Endpunkte

### B. Datenbank-Schema (Erweiterungen)

**Neue Tabellen**:
```sql
-- Referral Codes
CREATE TABLE referral_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_by INTEGER, -- Admin User ID
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

-- Events
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  tier1_total INTEGER DEFAULT 50,
  tier1_sold INTEGER DEFAULT 0,
  tier2_total INTEGER DEFAULT 30,
  tier2_sold INTEGER DEFAULT 0,
  tier3_total INTEGER DEFAULT 10,
  tier3_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. NÄCHSTE SCHRITTE

### Phase 1: Klärung & Finalisierung
1. ✅ **Beantwortung der Klärungsfragen**
2. ✅ **Finalisierung der UI-Texte**
3. ✅ **Bestätigung der technischen Anforderungen**

### Phase 2: Implementierung
1. **Backend-Erweiterungen**
   - Referral Code System
   - Admin Panel APIs
   - E-Mail-Integration (Resend)
   
2. **Frontend-Verbesserungen**
   - Gate-System Implementation
   - Live Counters & Activity Feed
   - Admin Panel UI

3. **Testing & Deployment**
   - End-to-End Tests
   - Production Deployment
   - Performance Optimierung

---

## 6. OFFENE PUNKTE

- [ ] **Rechtliche Aspekte**: Sind die aktuellen Datenschutz/Impressum-Seiten vollständig?
- [ ] **Zahlungsabwicklung**: Sollen weitere Zahlungsmethoden integriert werden?
- [ ] **Internationalisierung**: Sollen weitere Sprachen hinzugefügt werden?
- [ ] **SEO & Marketing**: Sind SEO-Optimierungen gewünscht?
- [ ] **Analytics**: Welche Metriken sollen getrackt werden?

---

**Bitte bestätigen Sie diese Spezifikationen und beantworten Sie die Klärungsfragen, damit wir mit der Implementierung fortfahren können.**
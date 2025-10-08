# Allgemeine Spezifikation – KINKLY Event Platform (Entwurf zur Freigabe v0.1)

Diese Spezifikation beschreibt Ziele, Umfang, Kernflüsse, Anforderungen und UI-Textentwürfe. Nach Ihrer Zustimmung dient sie als Grundlage für die Umsetzung des MVP.

---

## 1. Ziel und Umfang
- Luxuriöse, mystische User Experience für eine exklusive Eventreihe.
- Zugang nur via Referral Code (Einladung), alternative Warteliste für Interessenten.
- Ticketkauf via Stripe Checkout; Bestätigung und Onboarding nach erfolgreicher Zahlung.
- Einfaches Admin-Panel zur Verwaltung von Referral Codes, Events und Scarcity-Parametern.

Nicht enthalten (MVP):
- Umfassendes CMS, Community-Funktionen, Nutzerprofile, komplexe Rollen-/Rechte-Modelle über Admin hinaus, mobile App.

---

## 2. Zielgruppe & Tonalität
- Zielgruppe: Ein exklusives, zahlungskräftiges Publikum.
- Tonalität: Elegant, andeutungsreich, diskret, respektvoll; deutschsprachig, Anrede „Sie“ (anpassbar, siehe Klärungsfragen).

---

## 3. Rollen
- Gast (mit Code): Durchläuft Golden Path und kann Tickets kaufen.
- Interessent (ohne Code): Kann Warteliste nutzen.
- Admin: Verwalten von Events, Kontingenten/Scarcity, Referral Codes und Warteliste.

---

## 4. Kernnutzerflüsse mit UI-Textentwürfen

### 4.1 Das Tor (Referral-Code-Eingang)
- Zweck: Zutritt nur für Eingeladene.
- Erfolg: Validierter Code öffnet den Zugang.
- Fehler: Dezente Ablehnung, erneute Eingabe möglich.

UI-Textentwürfe:
```
Headline: DER SCHLÜSSEL, BITTE.
Eingabefeld Placeholder: Ihren Einladungscode eingeben
Primärer Button: EINTRETEN
Sekundärer Link: Eine Einladung anfragen
Fehlermeldung (ungültig): Der Schlüssel passt nicht.
Hinweis (Sicherheit): Ihr Zugang ist persönlich. Bitte teilen Sie Ihren Code nicht.
```

Technik:
- Backend: POST /api/auth/validate-code
- Logik: Prüfung auf Gültigkeit, Nutzungsanzahl, Ablaufdatum.

---

### 4.2 Das Sanctum (Event-Landing nach Zugang)
- Zweck: Event sichtbar machen, Knappheit elegant kommunizieren.
- Elemente: Live-Ticketzähler, dezente Activity-Hinweise, Ticket-Tiers.

UI-Textentwürfe:
```
Live-Ticketzähler: Nur noch {N} Plätze verfügbar.
Activity-Hinweis (flüchtig): Ein Platz im inneren Kreis wurde soeben besetzt.
Sektionstitel Tickets: Ihre Wahl.
Tier-Label Beispiele: Innerer Kreis, Diskreter Eintritt
Tier-CTA: Platz sichern
Hinweis klein (Verfügbarkeit): Verfügbarkeit ist begrenzt.
```

Technik:
- Backend: GET /api/events/status (Ticketstände)
- Frontend: Polling in moderater Frequenz; Anzeigen throttlen (Authentizität).

---

### 4.3 Die Verpflichtung (Ticketwahl & Zahlung)
- Zweck: Ticket auswählen, Stripe Checkout starten.
- Daten: Tier, Referral-Metadaten an Stripe übergeben.

UI-Textentwürfe:
```
Checkout-Einleitung: Ihre Entscheidung wird diskret und sicher verarbeitet.
Button zu Stripe: Zur sicheren Zahlung
Fehlermeldung (Abbruch): Die Sitzung wurde beendet. Versuchen Sie es erneut.
```

Technik:
- Backend: POST /api/payments/create-checkout-session → Stripe Checkout Redirect
- Stripe sammelt: Name, E-Mail, Zahlungsdaten (DE/EUR Standard; konfigurierbar)

---

### 4.4 Die Bestätigung (Erfolg & Onboarding)
- Zweck: Elegante Bestätigung, Gefühl von Zugehörigkeit.

UI-Textentwürfe:
```
Bestätigungsheadline: Willkommen im inneren Kreis. Ihre Reise beginnt.
Subline: Eine Bestätigung wurde an {E-Mail} gesendet.
Button (optional): Details ansehen
```

Technik:
- Redirect nach Zahlung: /success
- Webhook: POST /api/webhooks/stripe (checkout.session.completed) → Anlage von User/Ticket, Versand Bestätigungs-Mail (Resend)

---

### 4.5 Die Warteliste (ohne Code)
- Zweck: Interessenten sammeln, diskret informieren.

UI-Textentwürfe:
```
Modal-Titel: HINTERLASSEN SIE IHRE KARTE.
Text: Sollte ein Platz frei werden oder eine neue Soiree bevorstehen,
      könnten die Auserwählten eine Einladung erhalten.
E-Mail Placeholder: E‑Mail-Adresse eintragen
Primärer Button: ANFRAGEN
Erfolgsmeldung: Welcome to the Circle. Sie stehen auf der Warteliste.
               Die Einladung wird folgen.
```

Technik:
- Backend: POST /api/waitlist (E-Mail speichern)
- Double-Opt-In optional (siehe Klärungsfragen)

---

### 4.6 Admin (einfach, passwortgeschützt)
- Funktionen (MVP):
  - Referral Codes anlegen, befristen, max. Nutzungen setzen
  - Events verwalten (Basisdaten, sichtbarer Bestand/Scarcity)
  - Wartelisten-Einträge einsehen/exportieren

UI-Textentwürfe:
```
Login Headline: Verwaltung
Login Button: Anmelden
Codes Tabelle Spalten: Code, Besitzer, max. Nutzungen, genutzt, gültig bis
Aktion Buttons: Neu, Bearbeiten, Deaktivieren
Hinweis (Diskretion): Ihre Änderungen sind sofort wirksam.
```

Technik:
- Einfache Auth (Passwort/Basic, oder E-Mail-Login) im MVP; Härtung später

---

## 5. Architektur & Technologie
- Frontend: React, TypeScript, Vite, TanStack Query
- Backend: Node.js, Express.js
- Datenbank: PostgreSQL (Render)
- ORM: Prisma
- Deployment: Vercel (Frontend), Render (Backend & DB)
- Payments: Stripe (Checkout)
- Transaktionale E-Mails: Resend

---

## 6. API-Überblick (MVP)
- POST /api/auth/validate-code → Code validieren
- GET  /api/events/status → Ticketstände/Scarcity
- POST /api/payments/create-checkout-session → Stripe Checkout Session
- POST /api/webhooks/stripe → Zahlungswebhook (Server-zu-Server)
- POST /api/waitlist → Wartelisteintrag anlegen
- (Admin) CRUD-Endpunkte für Codes/Events (vereinfachter Satz)

---

## 7. Datenmodell (high-level)
- User (Gast), AdminUser
- ReferralCode { code, ownerUserId?, maxUses, usedCount, expiresAt, status }
- Event { id, name, date, tiers[], visibleRemainingByTier }
- Ticket { id, eventId, userId, tier, status, stripeSessionId }
- WaitlistEntry { id, email, createdAt, consent }
- Activity/EventLog (optionale Nachvollziehbarkeit)

---

## 8. Nicht-funktionale Anforderungen
- Performance: Schnell, sparsame Animationen, Mobile-First
- Zugriff: Page-Gate vor nicht-validierten Nutzern
- Sicherheit: HTTPS-only, sichere Secrets, serverseitige Validierung aller Eingaben
- Barrierefreiheit: Mind. Basis-Keyboard-Navigation, Kontrast beachtet
- SEO: Landing für Bots ggf. eingeschränkt/"noindex" (siehe Klärungsfragen)
- Logging/Monitoring: Basis-Server-Logs, Stripe-Dashboard als Quelle der Wahrheit

---

## 9. Rechtliches & Datenschutz
- Cookie Banner (react-cookie-consent), Verweis auf Datenschutz
- Impressum/Datenschutzseiten vorhanden; Altersverifikation (mind. Hinweis) falls erforderlich
- Datenminimierung: Nur notwendige personenbezogene Daten
- E-Mail Marketing nur mit Einwilligung (Double-Opt-In empfohlen)

---

## 10. Inhalte & Lokalisierung
- Primär DE; EN optional (später). Übersetzungen zentral administrierbar.
- Assets: Platzhalter (Logos/Bilder) bis finale Assets vorliegen.

---

## 11. Akzeptanzkriterien (MVP)
- [ ] Zugang via Code-Gate funktionsfähig inkl. Fehlermeldung
- [ ] Event-Landing zeigt Live-Knappheit & Activity-Hinweise dezent
- [ ] Ticketkauf via Stripe Checkout mit Referral-Metadaten
- [ ] Erfolgsscreen & Bestätigungs-E-Mail nach Zahlung
- [ ] Wartelisten-Erfassung mit Bestätigungstext
- [ ] Admin: Codes/Events minimal verwaltbar
- [ ] Datenschutz/Impressum erreichbar; Cookie-Banner vorhanden

---

## 12. Offene Punkte zur Klärung
1) Sprache & Anrede: Bleibt es bei „Sie“? Benötigen wir EN zum Start?
2) Tickettiers: Anzahl, Bezeichnungen, Zielpreise (Range genügt), Kontingente je Tier?
3) Scarcity: Echte Restbestände vs. kuratierte Anzeige (max. Frequenz der Activity-Hinweise)?
4) Referral Codes: Format, Standard-"maxUses", Standard-"expiresAt"?
5) Warteliste: Double-Opt-In gewünscht? Versand von Ankündigungen zulässig?
6) E-Mail-Absenderdomain: Bereits verifizierbar (SPF/DKIM/DMARC)?
7) Rechtliches: Alters-/Content-Hinweise nötig? SEO „noindex“ auf Öffnungsseite?
8) Admin-Auth: Reicht Passwort (MVP) oder brauchen wir 2FA/SSO kurzfristig?
9) Analytics: Erlaubt? Wenn ja, welches Tool (datenschutzfreundlich)?
10) Rückerstattungen/Stornos: Prozess, Texte, Kontaktadresse?
11) Branding: Primäre Farben/Typografie/Logo-Platzhalterdetails?
12) Roadmap: Mehrere Events parallel im MVP oder zunächst ein Event?

---

Bitte bestätigen Sie diese Spezifikation (ggf. mit Änderungswünschen). Nach Ihrer Zustimmung starten wir mit der Umsetzung entlang der Akzeptanzkriterien.

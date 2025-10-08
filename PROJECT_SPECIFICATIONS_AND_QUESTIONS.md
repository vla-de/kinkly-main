# KINKLY Berlin - Projekt-Spezifikationen und Klärende Fragen

## 📋 Aktueller Projektstand

Das Projekt ist eine exklusive Event-Plattform für "Kinkly Berlin" - eine luxuriöse, mystische Benutzererfahrung für eine exklusive, hochpreisige Event-Serie in der Kink-Szene. Die Plattform soll Eleganz und Exklusivität durch minimales Design vermitteln und psychologische Trigger wie FOMO und Knappheit nutzen.

## 🎯 Kernfunktionalitäten (bereits implementiert)

### 1. **Hauptbenutzerfluss (mit Referral Code)**
- **Der Schlüssel (Code-Eingabe)**: Benutzer müssen einen Referral Code eingeben
- **Das Heiligtum (Event-Enthüllung)**: Vollständige Landing Page nach Code-Validierung
- **Die Verpflichtung (Zahlung & Datensammlung)**: Ticket-Auswahl und Stripe-Integration
- **Die Bestätigung (Bestätigung & Onboarding)**: Success-Animation nach Zahlung

### 2. **Sekundärer Benutzerfluss (Warteliste)**
- Benutzer ohne Code können sich auf eine Warteliste setzen lassen

### 3. **Technologie-Stack**
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express.js
- **Datenbank**: PostgreSQL (Render)
- **Zahlungen**: Stripe
- **E-Mails**: Resend

## ❓ Klärende Fragen vor der Weiterentwicklung

### 1. **Design & Benutzeroberfläche**

**Frage 1.1**: Soll das aktuelle Design vollständig überarbeitet werden oder basierend auf dem bestehenden Code weiterentwickelt werden?

**Frage 1.2**: Welche spezifischen visuellen Elemente sind für die "mystische, luxuriöse" Ästhetik wichtig?
- Farbschema (aktuell: schwarz/grau)
- Typografie-Stil
- Animationen und Übergänge
- Logo-Design (aktuell: Placeholder)

**Frage 1.3**: Sollen die Textentwürfe der Benutzeroberflächen in deutscher Sprache bleiben oder ist eine mehrsprachige Unterstützung gewünscht?

### 2. **Funktionalität & Features**

**Frage 2.1**: Welche Admin-Panel-Funktionen sind prioritär?
- Benutzer- und Referral Code-Verwaltung
- Event- und Knappheits-Management
- Analytics und Berichte
- E-Mail-Kampagnen

**Frage 2.2**: Sollen zusätzliche Features implementiert werden?
- Benutzer-Authentifizierung und -Profile
- Event-Kalender
- Community-Features
- Mobile App

**Frage 2.3**: Wie soll die Knappheits-Simulation funktionieren?
- Echtzeit-Ticket-Zähler
- Live-Aktivitäts-Feed
- Automatische vs. manuelle Anpassungen

### 3. **Backend & Datenbank**

**Frage 3.1**: Welche Datenmodelle sind erforderlich?
- Benutzer (User)
- Referral Codes
- Events
- Tickets
- Zahlungen
- Warteliste

**Frage 3.2**: Sollen zusätzliche APIs implementiert werden?
- Analytics-Endpoints
- E-Mail-Newsletter
- Social Media Integration
- Webhook-Handler

### 4. **Sicherheit & Compliance**

**Frage 4.1**: Welche Sicherheitsmaßnahmen sind erforderlich?
- Rate Limiting
- Input Validation
- CORS-Konfiguration
- Datenverschlüsselung

**Frage 4.2**: Welche rechtlichen Anforderungen müssen erfüllt werden?
- DSGVO-Compliance
- Cookie-Consent
- Impressum und Datenschutz
- AGB

### 5. **Deployment & Hosting**

**Frage 5.1**: Sollen die aktuellen Hosting-Entscheidungen beibehalten werden?
- Frontend: Vercel
- Backend: Render
- Datenbank: PostgreSQL auf Render

**Frage 5.2**: Welche CI/CD-Pipeline ist gewünscht?
- Automatische Tests
- Staging-Umgebung
- Produktions-Deployment

## 🎨 Textentwürfe der Benutzeroberflächen

### **Der Schlüssel (Code-Eingabe)**
```
[Placeholder Logo/Symbol]

  DER SCHLÜSSEL, BITTE.

  [___________________]  (Eingabefeld für Code)
       [ EINTRETEN ]       (Submit-Button)

Eine Einladung anfragen (Subtle Text-Link unter dem Button)
```

### **Das Heiligtum (Event-Enthüllung)**
```
[Event-Titel]
[Event-Beschreibung]

Nur noch 17 Plätze verfügbar. (Live-Ticket-Zähler)

[Ein Platz im inneren Kreis wurde soeben besetzt.] (Live-Aktivitäts-Feed)

[Ticket-Tier-Auswahl]
[Kaufen-Button]
```

### **Warteliste-Modal**
```
HINTERLASSEN SIE IHRE KARTE.

Sollte ein Platz frei werden oder eine neue Soiree bevorstehen,
könnten die Auserwählten eine Einladung erhalten.

[ E-Mail-Adresse eintragen ]
       [ ANFRAGEN ]

Welcome to the Circle. You are now on the waitlist. 
The invitation will follow. (Bestätigungsnachricht)
```

### **Erfolgs-Animation**
```
Willkommen im inneren Kreis. Ihre Reise beginnt.

[Animation/Visuelles Element]

Ihre Bestätigung wurde an Ihre E-Mail-Adresse gesendet.
```

## 📝 Nächste Schritte

1. **Beantwortung der klärenden Fragen** durch den Kunden
2. **Anpassung der Spezifikationen** basierend auf den Antworten
3. **Erstellung eines detaillierten Entwicklungsplans** mit Meilensteinen
4. **Implementierung** der vereinbarten Features

## ⚠️ Wichtige Hinweise

- Das Projekt verwendet bereits eine solide technische Basis
- Die aktuelle Architektur ist skalierbar und erweiterbar
- Alle kritischen Funktionen (Zahlungen, E-Mails, Datenbank) sind bereits integriert
- Die Benutzeroberfläche ist responsiv und modern gestaltet

---

**Bitte beantworten Sie die oben gestellten Fragen, damit wir mit der Weiterentwicklung fortfahren können.**
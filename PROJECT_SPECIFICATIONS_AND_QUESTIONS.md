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

## ✅ Bestätigte Spezifikationen

### 1. **Design & Benutzeroberfläche**

**1.1**: ✅ **Bestehender Code als Basis** - Weiterentwicklung auf der aktuellen Architektur

**1.2**: ✅ **Visuelle Elemente**:
- **Farbschema**: Schwarz/Grau beibehalten
- **Typografie**: Aktueller Stil beibehalten
- **Animationen**: Subtile Hover-Effekte mit Glow-Effekt für Buttons
- **Logo**: Buchstabe "K" in Cormorant-Semi
- **Exklusivität**: Weitere subtile Effekte für luxuriöse Atmosphäre

**1.3**: ✅ **Mehrsprachigkeit**: DE/EN zweisprachig, erweitert bei neuen Texten

### 2. **Funktionalität & Features**

**2.1**: ✅ **Admin-Panel (Priorität)**:
- Benutzer- und Referral Code-Verwaltung
- Knappheits-Management (Event-Management später)
- Analytics und Berichte
- E-Mail-Kampagnen

**2.2**: ✅ **Zusätzliche Features**:
- Benutzer-Authentifizierung und -Profile
- Werber/Referral-Benutzer mit Einsicht der geworbenen Anzahl

**2.3**: ✅ **Knappheits-Simulation**:
- Nach Kauf automatisch -1
- Manuelle Anpassung im Admin-Bereich
- Simulierter Live-Feed alle paar Minuten oder vor Verlassen des Bereichs

### 3. **Backend & Datenbank**

**3.1**: ✅ **Datenmodelle**:
- Benutzer (User) - wird zum Werber wenn Code anfordert
- Referral Codes
- Events
- Tickets
- Zahlungen
- Warteliste
- Werber-Profile

**3.2**: ✅ **APIs**: Analytics, E-Mail, Webhook-Handler

### 4. **Sicherheit & Compliance**

**4.1**: ✅ **Sicherheit**: Best Practice für Zahlungen und Kundenschutz

**4.2**: ✅ **Rechtliche Anforderungen**: DSGVO, Cookie-Consent, Impressum, Datenschutz, AGB

### 5. **Deployment & Hosting**

**5.1**: ✅ **Hosting**: Vercel (Frontend), Render (Backend & DB)

**5.2**: ✅ **CI/CD**: Best Practice, nicht aufgebläht, schneller Live-Gang

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
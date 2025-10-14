import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Datenschutz: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-4">
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">{t.datenschutz_title}</h2>
      
      <div className="space-y-4">
        <p>
          Wir legen größten Wert auf den Schutz Ihrer Daten und die Wahrung Ihrer Privatsphäre. Nachstehend informieren wir Sie deshalb über die Erhebung und Verwendung persönlicher Daten bei Nutzung unserer Webseite.
        </p>

        <h3 className="font-bold text-white">1. Verantwortliche Stelle</h3>
        <div className="bg-gray-800 p-4 rounded-md mb-4">
          <p>
            K | PRODUKTION<br />
            Bayreuther Straße 36<br />
            10789 Berlin<br />
            E-Mail: contact@k-production.eu<br />
            Geschäftsführerin: Jenny Westphal
          </p>
        </div>

        <h3 className="font-bold text-white">2. Erhebung, Verarbeitung und Nutzung personenbezogener Daten</h3>
        <p>
          Wir erheben folgende personenbezogene Daten:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>Vor- und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Gewählte Ticket-Kategorie</li>
          <li>Optionale Nachricht</li>
          <li>Elite Passcode (falls vorhanden)</li>
        </ul>
        <p>
          Diese Daten werden ausschließlich zur Bearbeitung Ihrer Anmeldung und zur Durchführung des Events verwendet.
        </p>

        <h3 className="font-bold text-white">3. Zahlungsabwicklung</h3>
        <p>
          Für die Abwicklung der Zahlungen nutzen wir die Dienstleister Stripe (Stripe, Inc.) und PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A.). Ihre Zahlungsdaten werden direkt von diesen Dienstleistern erfasst und verarbeitet. Wir erhalten keinen Zugriff auf Ihre vollständigen Zahlungsdaten. Die Datenübermittlung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        </p>
        
        <h3 className="font-bold text-white">4. Datensicherheit</h3>
        <p>
          Wir sichern unsere Website und sonstigen Systeme durch technische und organisatorische Maßnahmen gegen Verlust, Zerstörung, Zugriff, Veränderung oder Verbreitung Ihrer Daten durch unbefugte Personen. Die Kommunikation mit unserer Website erfolgt über eine verschlüsselte SSL/TLS-Verbindung.
        </p>

        <h3 className="font-bold text-white">5. Cookies und Tracking</h3>
        <p>
          Wir verwenden Cookies für die Funktionalität der Website und zur Verbesserung der Benutzererfahrung. Sie können Cookies in Ihren Browser-Einstellungen deaktivieren.
        </p>

        <h3 className="font-bold text-white">6. Ihre Rechte</h3>
        <p>
          Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>Auskunftsrecht (Art. 15 DSGVO)</li>
          <li>Berichtigungsrecht (Art. 16 DSGVO)</li>
          <li>Löschungsrecht (Art. 17 DSGVO)</li>
          <li>Einschränkungsrecht (Art. 18 DSGVO)</li>
          <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        </ul>
        <p>
          Kontaktieren Sie uns unter: contact@k-production.eu
        </p>

        <h3 className="font-bold text-white">7. Dauer der Datenspeicherung</h3>
        <p>
          Wir speichern Ihre Daten nur so lange, wie es für die Erfüllung der Zwecke erforderlich ist:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>Event-Anmeldungen: Bis 3 Jahre nach dem Event</li>
          <li>Warteliste: Bis zur Anmeldung oder 2 Jahre</li>
          <li>Zahlungsdaten: Gemäß gesetzlicher Aufbewahrungsfristen</li>
        </ul>

        <h3 className="font-bold text-white">8. Beschwerderecht</h3>
        <p>
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
        </p>

        <div className="mt-6 p-4 bg-gray-800 rounded-md">
          <p className="text-xs">
            <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
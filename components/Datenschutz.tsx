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
        <p>
          Verantwortliche Stelle für die Datenerhebung, -verarbeitung und -nutzung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist: Max Mustermann, Musterstraße 111, 10115 Berlin (Platzhalter).
        </p>

        <h3 className="font-bold text-white">2. Erhebung, Verarbeitung und Nutzung personenbezogener Daten</h3>
        <p>
          Wir erheben, verarbeiten und nutzen Ihre personenbezogenen Daten nur, wenn Sie uns diese im Rahmen Ihrer Bewerbung (Anfrage einer Einladung) freiwillig mitteilen. Zu den personenbezogenen Daten gehören Ihr Name, Ihre E-Mail-Adresse sowie die von Ihnen optional angegebene Nachricht. Diese Daten werden ausschließlich zur Bearbeitung Ihrer Bewerbung und zur eventuellen Kontaktaufnahme bezüglich Ihrer Bewerbung verwendet.
        </p>

        <h3 className="font-bold text-white">3. Zahlungsabwicklung</h3>
        <p>
          Für die Abwicklung der Bewerbungsgebühr nutzen wir die Dienstleister Stripe (Stripe, Inc.) und PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A.). Ihre Zahlungsdaten (z.B. Kreditkartennummer) werden direkt von diesen Dienstleistern erfasst und verarbeitet. Wir erhalten keinen Zugriff auf Ihre vollständigen Zahlungsdaten. Die Datenübermittlung an diese Dienstleister erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Verarbeitung zur Erfüllung eines Vertrags).
        </p>
        
        <h3 className="font-bold text-white">4. Datensicherheit</h3>
        <p>
          Wir sichern unsere Website und sonstigen Systeme durch technische und organisatorische Maßnahmen gegen Verlust, Zerstörung, Zugriff, Veränderung oder Verbreitung Ihrer Daten durch unbefugte Personen. Die Kommunikation mit unserer Website erfolgt über eine verschlüsselte SSL/TLS-Verbindung.
        </p>

        <h3 className="font-bold text-white">5. Ihre Rechte</h3>
        <p>
          Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
        </p>

        <h3 className="font-bold text-white">6. Dauer der Datenspeicherung</h3>
        <p>
          Ihre Daten werden nach abschließender Bearbeitung Ihrer Bewerbung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Im Falle einer erfolgreichen Bewerbung werden die für die Durchführung des Events notwendigen Daten für die Dauer der Vertragsbeziehung gespeichert.
        </p>

        <p>
          Stand: Mai 2024 (Platzhalter)
        </p>
      </div>
    </div>
  );
};

export default Datenschutz;
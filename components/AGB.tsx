import React from 'react';

const AGB: React.FC = () => {
  return (
    <div className="text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-4">
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">Allgemeine Geschäftsbedingungen</h2>
      
      <div className="space-y-4">
        <h3 className="font-bold text-white">§ 1 Geltungsbereich</h3>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen K | PRODUKTION (nachfolgend "Veranstalter") 
          und den Teilnehmern der Kinkly Berlin Events (nachfolgend "Teilnehmer").
        </p>

        <h3 className="font-bold text-white">§ 2 Vertragspartner</h3>
        <div className="bg-gray-800 p-4 rounded-md mb-4">
          <p>
            K | PRODUKTION<br />
            Bayreuther Straße 36<br />
            10789 Berlin<br />
            E-Mail: contact@k-production.eu<br />
            Geschäftsführerin: Jenny Westphal
          </p>
        </div>

        <h3 className="font-bold text-white">§ 3 Anmeldung und Vertragsschluss</h3>
        <p>
          Die Anmeldung erfolgt ausschließlich über unsere Website. Mit der Übermittlung der Anmeldung gibt der Teilnehmer 
          ein verbindliches Angebot auf Abschluss eines Teilnahmevertrags ab. Der Vertrag kommt durch unsere schriftliche 
          Bestätigung oder durch die erfolgreiche Zahlung zustande.
        </p>

        <h3 className="font-bold text-white">§ 4 Teilnahmevoraussetzungen</h3>
        <p>
          Teilnahmeberechtigt sind ausschließlich Personen, die:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>das 18. Lebensjahr vollendet haben</li>
          <li>einen gültigen Elite Passcode besitzen oder auf der Warteliste stehen</li>
          <li>die Teilnahmegebühr vollständig entrichtet haben</li>
          <li>sich mit den Event-Regeln einverstanden erklärt haben</li>
        </ul>

        <h3 className="font-bold text-white">§ 5 Preise und Zahlungsbedingungen</h3>
        <p>
          Die Teilnahmegebühren betragen:
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>The Invitation: €995</li>
          <li>The Circle: €2.000</li>
          <li>The Inner Sanctum: €10.000</li>
        </ul>
        <p>
          Alle Preise verstehen sich inklusive MwSt. Die Zahlung erfolgt im Voraus per Kreditkarte (Stripe) oder PayPal. 
          Bei Zahlungsverzug behalten wir uns das Recht vor, die Teilnahme zu verweigern.
        </p>

        <h3 className="font-bold text-white">§ 6 Rücktritt und Stornierung</h3>
        <p>
          <strong>Rücktritt durch den Teilnehmer:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
          <li>Bis 30 Tage vor dem Event: 80% Rückerstattung</li>
          <li>Bis 14 Tage vor dem Event: 50% Rückerstattung</li>
          <li>Bis 7 Tage vor dem Event: 25% Rückerstattung</li>
          <li>Weniger als 7 Tage vor dem Event: Keine Rückerstattung</li>
        </ul>
        <p>
          <strong>Rücktritt durch den Veranstalter:</strong><br />
          Bei Absage des Events durch den Veranstalter erfolgt eine vollständige Rückerstattung der Teilnahmegebühr. 
          Weitere Ansprüche sind ausgeschlossen, es sei denn, der Veranstalter handelt vorsätzlich oder grob fahrlässig.
        </p>

        <h3 className="font-bold text-white">§ 7 Haftung und Versicherung</h3>
        <p>
          Der Veranstalter haftet nur für Schäden, die auf Vorsatz oder grober Fahrlässigkeit beruhen. Die Haftung für 
          leichte Fahrlässigkeit ist auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Der Teilnehmer ist 
          verpflichtet, eine ausreichende Haftpflichtversicherung abzuschließen.
        </p>

        <h3 className="font-bold text-white">§ 8 Verhaltensregeln</h3>
        <p>
          Alle Teilnehmer verpflichten sich, die Event-Regeln einzuhalten und sich respektvoll zu verhalten. 
          Bei Verstößen behält sich der Veranstalter das Recht vor, Teilnehmer vom Event auszuschließen. 
          In diesem Fall besteht kein Anspruch auf Rückerstattung.
        </p>

        <h3 className="font-bold text-white">§ 9 Datenschutz</h3>
        <p>
          Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung. 
          Mit der Anmeldung erklärt sich der Teilnehmer mit der Datenverarbeitung einverstanden.
        </p>

        <h3 className="font-bold text-white">§ 10 Bild- und Tonaufnahmen</h3>
        <p>
          <strong>Datenschutz und Diskretion:</strong><br />
          Als hoch exklusiver Club legen wir größten Wert auf die Privatsphäre und Diskretion unserer Mitglieder. 
          Alle Kameras und Aufnahmegeräte müssen am Eingang abgegeben werden. Circle-Mitglieder erhalten 
          ein spezielles Kommunikationsgerät ohne Foto-/Videofunktion.
        </p>
        <p>
          <strong>Professionelle Dokumentation:</strong><br />
          Eventuelle professionelle Aufnahmen erfolgen ausschließlich in maskierter und unkenntlicher Form. 
          Personenbezogene Zuordnungen sind ausgeschlossen. Alle Aufnahmen unterliegen strengen 
          Datenschutzbestimmungen und werden nur für interne Zwecke verwendet.
        </p>
        <p>
          <strong>Einverständniserklärung:</strong><br />
          Mit der Teilnahme erklären Sie sich einverstanden, dass eventuelle professionelle Aufnahmen 
          in anonymisierter Form für interne Dokumentationszwecke verwendet werden dürfen.
        </p>

        <h3 className="font-bold text-white">§ 11 Schlussbestimmungen</h3>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen 
          unberührt. Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Berlin.
        </p>

        <h3 className="font-bold text-white">§ 12 Widerrufsrecht</h3>
        <p>
          Da es sich um eine Dienstleistung in der Freizeitgestaltung handelt, besteht kein Widerrufsrecht nach § 312g BGB.
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

export default AGB;

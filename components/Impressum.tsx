import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Impressum: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-gray-300 text-sm max-h-[70vh] overflow-y-auto pr-4">
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">{t.impressum_title}</h2>
      
      <div className="space-y-4">
        <h3 className="font-bold text-white">Angaben gemäß § 5 TMG</h3>
        <div className="bg-gray-800 p-4 rounded-md mb-4">
          <p>
            K | PRODUKTION<br />
            Bayreuther Straße 36<br />
            10789 Berlin<br />
            Deutschland
          </p>
        </div>

        <h3 className="font-bold text-white">Geschäftsführung</h3>
        <p>
          Jenny Westphal
        </p>

        <h3 className="font-bold text-white">Kontakt</h3>
        <p>
          E-Mail: contact@k-production.eu
        </p>

        <h3 className="font-bold text-white">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
        <p>
          Jenny Westphal<br />
          Anschrift wie oben
        </p>

        <h3 className="font-bold text-white">Haftungsausschluss (Disclaimer)</h3>
        <p>
          <strong>Haftung für Inhalte</strong><br />
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>

        <p>
          <strong>Haftung für Links</strong><br />
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>

        <p>
          <strong>Urheberrecht</strong><br />
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
        </p>
      </div>
    </div>
  );
};

export default Impressum;
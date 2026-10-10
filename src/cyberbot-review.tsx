import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './components/companion/approved/cyberbot-review.css';
import { CyberBotReviewContext, type ApprovedCyberBotFace, type CyberBotReviewState } from './components/companion/approved/CyberBotReviewContext';

const labels = {
  es: { title: 'Revisión de CyberBot', description: 'Diseño aprobado dentro de CyberLauncher, a tamaño real.',
    launcher: 'Reposo', 'launcher-top': 'Dos cubos', default: 'Ojos', marquee: 'Marquee', terminal: 'Terminal', curious: 'Curioso', flight: 'Vuelo', sleeping: 'Dormido', alert: 'Alerta',
    screen: 'Caer y convertirse en pantalla', paused: 'Mantener el cuerpo', speaking: 'Ecualizador al hablar', motion: 'Animaciones', close: 'Ocultar controles', show: 'Mostrar controles',
    note: 'Primera etapa: apariencia y transformación. Frases y comportamiento existentes se conservan; el reemplazo completo sigue pendiente.', },
  en: { title: 'CyberBot review', description: 'Approved design inside CyberLauncher, at its actual size.',
    launcher: 'Resting', 'launcher-top': 'Two cubes', default: 'Eyes', marquee: 'Marquee', terminal: 'Terminal', curious: 'Curious', flight: 'Flight', sleeping: 'Sleeping', alert: 'Alert',
    screen: 'Land and become a screen', paused: 'Keep the body', speaking: 'Speech equalizer', motion: 'Animations', close: 'Hide controls', show: 'Show controls',
    note: 'First stage: appearance and transformation. Existing phrases and behavior are preserved; the complete replacement is pending.', },
};

function Review() {
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<CyberBotReviewState>({ face: 'launcher', marqueeMode: 'screen', speaking: false, motion: true });
  const t = labels[language];
  return <CyberBotReviewContext.Provider value={state}>
    <App />
    <aside className="cyberbot-review-controls" data-no-hide data-cyberbot-obstacle="bounds" aria-label={t.title}>
      {visible ? <>
        <div className="cyberbot-review-heading"><strong>{t.title}</strong>
          <select aria-label={language === 'es' ? 'Idioma de los controles' : 'Controls language'} value={language} onChange={e => setLanguage(e.target.value as 'es' | 'en')}>
            <option value="es">Español</option><option value="en">English</option>
          </select>
        </div>
        <p>{t.description}</p>
        <div className="cyberbot-review-faces">{(['launcher', 'marquee', 'terminal', 'curious', 'flight', 'sleeping', 'alert', 'launcher-top', 'default'] as ApprovedCyberBotFace[]).map(face =>
          <button type="button" key={face} aria-pressed={state.face === face} onClick={() => setState(s => ({ ...s, face }))}>{t[face]}</button>)}</div>
        <label><input type="checkbox" checked={state.marqueeMode === 'screen'} onChange={e => setState(s => ({ ...s, marqueeMode: e.target.checked ? 'screen' : 'paused' }))} />{t.screen}</label>
        <label><input type="checkbox" checked={state.speaking} onChange={e => setState(s => ({ ...s, speaking: e.target.checked }))} />{t.speaking}</label>
        <label><input type="checkbox" checked={state.motion} onChange={e => setState(s => ({ ...s, motion: e.target.checked }))} />{t.motion}</label>
        <p>{t.note}</p>
        <button type="button" onClick={() => setVisible(false)}>{t.close}</button>
      </> : <button type="button" onClick={() => setVisible(true)}>{t.show}</button>}
    </aside>
  </CyberBotReviewContext.Provider>;
}

createRoot(document.getElementById('root')!).render(<Review />);

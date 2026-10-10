import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './components/companion/approved/cyberbot-review.css';
import { CyberBotReviewContext, type CyberBotReviewState } from './components/companion/approved/CyberBotReviewContext';

const labels = {
  es: { title: 'Revisión de CyberBot', description: 'Diseño aprobado dentro de CyberLauncher, a tamaño real.',
    launcher: 'Reposo', 'launcher-top': 'Dos cubos', default: 'Ojos', marquee: 'Marquee', terminal: 'Terminal', curious: 'Curioso', flight: 'Vuelo', sleeping: 'Dormido', alert: 'Alerta',
    happy: 'Sonrisa', delighted: 'Satisfecho', affectionate: 'Afecto', sparkle: 'Destello', wink: 'Guiño', scared: 'Sobresalto', storage: 'Disco', success: 'Éxito', speakingFace: 'Habla',
    screen: 'Caer y convertirse en pantalla', paused: 'Mantener el cuerpo', speaking: 'Ecualizador al hablar', motion: 'Animaciones', close: 'Ocultar controles', show: 'Mostrar controles',
    live: 'Comportamiento real', inspect: 'Inspeccionar expresiones',
    note: 'El modo real utiliza las frases y estados del launcher. La inspección permite fijar una expresión para revisarla.', },
  en: { title: 'CyberBot review', description: 'Approved design inside CyberLauncher, at its actual size.',
    launcher: 'Resting', 'launcher-top': 'Two cubes', default: 'Eyes', marquee: 'Marquee', terminal: 'Terminal', curious: 'Curious', flight: 'Flight', sleeping: 'Sleeping', alert: 'Alert',
    happy: 'Smile', delighted: 'Pleased', affectionate: 'Affection', sparkle: 'Sparkle', wink: 'Wink', scared: 'Startled', storage: 'Disk', success: 'Success', speakingFace: 'Speaking',
    screen: 'Land and become a screen', paused: 'Keep the body', speaking: 'Speech equalizer', motion: 'Animations', close: 'Hide controls', show: 'Show controls',
    live: 'Real behavior', inspect: 'Inspect expressions',
    note: 'Live mode uses launcher phrases and states. Inspection lets you hold an expression for review.', },
};

function Review() {
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [visible, setVisible] = useState(true);
  const [live, setLive] = useState(false);
  const [state, setState] = useState<CyberBotReviewState>({ face: 'launcher', marqueeMode: 'screen', speaking: false, motion: true });
  const t = labels[language];
  return <CyberBotReviewContext.Provider value={live ? null : state}>
    <App />
    <aside className="cyberbot-review-controls" data-no-hide data-cyberbot-obstacle={live ? undefined : "bounds"} aria-label={t.title}>
      {visible ? <>
        <div className="cyberbot-review-heading"><strong>{t.title}</strong>
          <select aria-label={language === 'es' ? 'Idioma de los controles' : 'Controls language'} value={language} onChange={e => setLanguage(e.target.value as 'es' | 'en')}>
            <option value="es">Español</option><option value="en">English</option>
          </select>
        </div>
        <p>{t.description}</p>
        <button type="button" aria-pressed={live} onClick={() => setLive(value => !value)}>{live ? t.inspect : t.live}</button>
        <div className="cyberbot-review-faces">{(['launcher', 'marquee', 'terminal', 'curious', 'flight', 'sleeping', 'alert', 'launcher-top', 'default', 'happy', 'delighted', 'affectionate', 'sparkle', 'wink', 'scared', 'storage', 'success', 'speaking'] as const).map(face =>
          <button type="button" key={face} aria-pressed={!live && state.face === face} onClick={() => { setLive(false); setState(s => ({ ...s, face })); }}>{t[face === "speaking" ? "speakingFace" : face]}</button>)}</div>
        <label><input type="checkbox" disabled={live} checked={state.marqueeMode === 'screen'} onChange={e => setState(s => ({ ...s, marqueeMode: e.target.checked ? 'screen' : 'paused' }))} />{t.screen}</label>
        <label><input type="checkbox" checked={state.speaking} onChange={e => setState(s => ({ ...s, speaking: e.target.checked }))} />{t.speaking}</label>
        <label><input type="checkbox" checked={state.motion} onChange={e => setState(s => ({ ...s, motion: e.target.checked }))} />{t.motion}</label>
        <p>{t.note}</p>
        <button type="button" onClick={() => setVisible(false)}>{t.close}</button>
      </> : <button type="button" onClick={() => setVisible(true)}>{t.show}</button>}
    </aside>
  </CyberBotReviewContext.Provider>;
}

createRoot(document.getElementById('root')!).render(<Review />);

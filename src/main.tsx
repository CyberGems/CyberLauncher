import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);

// CyberViewer pattern: notify main after first painted frame (double-rAF)
const electronAPI = (window as Window & { electronAPI?: { uiReady?: () => void } }).electronAPI;
if (electronAPI?.uiReady) {
  const notifyReady = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          electronAPI.uiReady!();
        } catch {
          /* ignore */
        }
      });
    });
  };
  if (document.readyState === 'complete') notifyReady();
  else window.addEventListener('load', notifyReady, { once: true });
}

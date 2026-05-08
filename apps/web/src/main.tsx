import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './app/i18n'; // initialize react-i18next before any component renders
import App from './app/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

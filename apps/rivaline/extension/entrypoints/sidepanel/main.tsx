import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/base.css';
import '@line/ui/ui.css';
import '@line/ui/serpline.css';
import './panel.css';
import { Panel } from './Panel.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Panel />
  </StrictMode>,
);

import { Logo } from '@line/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/base.css';
import { useT } from '../../src/useLang.ts';

/** Step 2 placeholder. The full Welcome artboard is built in step 7. */
function Welcome() {
  const { t } = useT();
  return (
    <main style={{ maxWidth: 640, margin: '96px auto', padding: '0 24px', textAlign: 'center' }}>
      <Logo brand="hitline" theme="light" size={44} word />
      <h1
        className="disp"
        style={{ fontSize: 34, letterSpacing: '-0.03em', margin: '28px 0 10px' }}
      >
        {t('welcome.title')}
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: '#4a4a5c', margin: 0 }}>
        {t('welcome.lead')}
      </p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Welcome />
  </StrictMode>,
);

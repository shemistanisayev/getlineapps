import { Logo } from '@line/ui';
import { contactUrl } from '@line/core/site';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/base.css';
import './welcome.css';
import { useT } from '../../src/useLang.ts';
import { Icon } from '../../src/ui.tsx';

const CONTACT = contactUrl({ source: 'hitline', medium: 'extension', campaign: 'welcome' });

/** Opened once after install: design/hitline/Welcome.dc.html. */
function Welcome() {
  const { t } = useT();
  const [before, after] = t('welcome.s3.title').split('{key}') as [string, string?];
  return (
    <main className="wel">
      <div className="wel-left">
        <Logo brand="hitline" theme="light" size={44} word />
        <h1 className="disp">
          {t('welcome.title')}
          <br />
          <span className="accent">{t('welcome.accent')}</span>
        </h1>
        <p className="lead">{t('welcome.lead')}</p>
        <ul className="chips">
          {(['welcome.free', 'welcome.noAccount', 'welcome.local'] as const).map((k) => (
            <li key={k}>
              <Icon name="check" />
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
      <div className="wel-right">
        <ol className="steps">
          <li className="card">
            <span className="disp n">1</span>
            <div>
              <h2>{t('welcome.s1.title')}</h2>
              <p>{t('welcome.s1.text')}</p>
            </div>
          </li>
          <li className="card">
            <span className="disp n">2</span>
            <div>
              <h2>{t('welcome.s2.title')}</h2>
              <p>{t('welcome.s2.text')}</p>
            </div>
          </li>
          <li className="hero">
            <span className="disp n">3</span>
            <div>
              <h2>
                {before}
                <kbd className="mono">F12</kbd>
                {after}
              </h2>
              <p>{t('welcome.s3.text')}</p>
            </div>
          </li>
        </ol>
        <div className="wel-foot">
          <span>{t('welcome.built')}</span>
          <a href={CONTACT}>
            {t('welcome.contact')}
            <Icon name="arrow" size={14} stroke={2.4} />
          </a>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Welcome />
  </StrictMode>,
);

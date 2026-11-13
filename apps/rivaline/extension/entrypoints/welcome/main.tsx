import { contactUrl } from '@line/core/site';
import { Logo } from '@line/ui';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/base.css';
import { actionShortcut } from '../../src/storage.ts';
import { Icon, Keys } from '../../src/ui.tsx';
import { useT } from '../../src/useLang.ts';
import './welcome.css';

const CONTACT = contactUrl({ source: 'rivaline', medium: 'extension', campaign: 'welcome' });

/** Opened once after install: design/rivaline/Welcome.dc.html (polished in step 8). */
function Welcome() {
  const { t } = useT();
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => void actionShortcut().then(setKeys), []);
  return (
    <main className="wel">
      <div className="wel-left">
        <Logo brand="rivaline" theme="light" size={44} word />
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
              <p>
                {keys.length ? (
                  <>
                    {t('welcome.s2.text')} <Keys keys={keys} />
                  </>
                ) : (
                  t('welcome.s2.noKeys')
                )}
              </p>
            </div>
          </li>
          <li className="hero">
            <span className="disp n">3</span>
            <div>
              <h2>{t('welcome.s3.title')}</h2>
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

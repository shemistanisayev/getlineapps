import {
  brandName,
  brandSlug,
  exportCss,
  exportFileNames,
  exportJson,
  type BrandColor,
  type BrandKit,
} from '@line/core/rivaline';
import {
  ButtonPreview,
  CardHead,
  CodeBlock,
  FontRow,
  LogoBox,
  RvButton,
  RvCard,
  Segmented,
  Sheet,
  Swatch,
} from '@line/ui/rivaline';
import { useEffect, useMemo, useState } from 'react';
import type { ScanResult } from '../../src/capture/scan.ts';
import type { MessageKey, T } from '../../src/i18n/index.ts';
import { downloadBlob, palettePng } from '../../src/palette.ts';

type Format = 'css' | 'json' | 'png';
const COPIED_MS = 2000;

/** A button as light as the white card needs an outline to be seen (QA: HubSpot). */
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 235;
};

const roleLabel = (t: T) => (role: BrandColor['role']) => t(`role.${role}` as MessageKey);

/** Brand tab (design: Brand) and its export sheet (design: BrandExport). */
export function BrandTab({
  result,
  t,
  onToast,
}: {
  result: ScanResult;
  t: T;
  onToast: (text: string) => void;
}) {
  const kit: BrandKit = result.brand ?? {
    colors: [],
    heading: null,
    body: null,
    button: null,
    logo: null,
  };
  const host = new URL(result.url).host;
  const name = brandName(result.snapshot) || host;
  const slug = brandSlug(name);
  const [sheet, setSheet] = useState<Format | null>(null);

  const logoUrl = useMemo(
    () => (result.logo ? URL.createObjectURL(result.logo) : null),
    [result.logo],
  );
  useEffect(() => () => void (logoUrl && URL.revokeObjectURL(logoUrl)), [logoUrl]);

  const copyText = async (text: string, toast: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(toast);
    } catch {
      /* clipboard blocked */
    }
  };
  const copyPng = async (blob: Blob, toast: string) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      onToast(toast);
    } catch {
      /* clipboard blocked */
    }
  };

  const font = (role: 'headings' | 'body', f: BrandKit['heading']) =>
    f && (
      <FontRow
        role={t(`brand.${role}`)}
        name={f.family}
        detail={t('brand.fontDetail', { weight: f.weight, size: f.size })}
        source={t(`src.${f.source}` as MessageKey)}
      />
    );
  const b = kit.button;

  return (
    <>
      <RvCard className="rp-pad" label={t('brand.logo')}>
        <CardHead
          title={t('brand.logo')}
          note={
            kit.logo && logoUrl
              ? t('brand.logoFrom', {
                  w: Math.round(kit.logo.rect.width),
                  h: Math.round(kit.logo.rect.height),
                })
              : undefined
          }
        />
        {logoUrl && result.logo ? (
          <div className="rp-logo">
            <LogoBox>
              <img src={logoUrl} alt={t('brand.logoAlt', { host })} />
            </LogoBox>
            <div className="rp-col">
              <RvButton onClick={() => void copyPng(result.logo!, t('brand.logoCopied'))}>
                {t('brand.copyPng')}
              </RvButton>
              <RvButton onClick={() => downloadBlob(result.logo!, `${slug}-logo.png`)}>
                {t('brand.downloadPng')}
              </RvButton>
              {kit.logo?.svg && (
                <RvButton onClick={() => void copyText(kit.logo!.svg!, t('brand.svgCopied'))}>
                  {t('brand.copySvg')}
                </RvButton>
              )}
            </div>
          </div>
        ) : (
          <p className="rp-muted">
            {t(
              !kit.logo
                ? 'brand.noLogo'
                : kit.logo.covered
                  ? 'brand.logoCovered'
                  : 'brand.logoMissing',
            )}
          </p>
        )}
      </RvCard>

      <RvCard className="rp-pad" label={t('brand.colors')}>
        <CardHead
          title={t('brand.colors')}
          note={kit.colors.length ? t('brand.clickCopy') : undefined}
        />
        {kit.colors.length ? (
          <div className="rv-swatches">
            {kit.colors.map((c) => (
              <Swatch
                key={c.role}
                role={t(`role.${c.role}` as MessageKey)}
                hex={c.hex}
                copyLabel={t('brand.copyHex', { hex: c.hex })}
                onCopy={() => void copyText(c.hex, t('brand.hexCopied', { hex: c.hex }))}
              />
            ))}
          </div>
        ) : (
          <p className="rp-muted">{t('brand.noColors')}</p>
        )}
      </RvCard>

      {(kit.heading || kit.body) && (
        <RvCard className="rp-pad rp-fonts" label={t('brand.fonts')}>
          <CardHead title={t('brand.fonts')} />
          {font('headings', kit.heading)}
          {font('body', kit.body)}
        </RvCard>
      )}

      <RvCard className="rp-pad" label={t('brand.button')}>
        <CardHead title={t('brand.button')} />
        {b ? (
          <ButtonPreview
            label={b.label}
            style={{
              height: Math.min(b.height, 48),
              padding: `0 ${Math.min(b.paddingX, 28)}px`,
              borderRadius: b.radius,
              background: b.background,
              color: b.text,
              border: b.border
                ? `${b.border.split(' ')[0]} solid ${b.border.split(' ')[1]}`
                : isLight(b.background)
                  ? '1px solid #c9c5d6'
                  : undefined,
              fontFamily: `"${b.family}", Arial, sans-serif`,
              fontSize: Math.min(b.size, 16),
              fontWeight: Number(b.weight) || 600,
            }}
            spec={[
              t('brand.btnBg', { hex: b.background }),
              t('brand.btnBox', { radius: b.radius, h: b.height }),
              t('brand.btnFont', { family: b.family, weight: b.weight, size: b.size }),
            ]}
          />
        ) : (
          <p className="rp-muted">{t('brand.noButton')}</p>
        )}
      </RvCard>

      <div className="rp-export" role="group" aria-label={t('brand.export')}>
        <span>{t('brand.export')}</span>
        {(['css', 'png', 'json'] as const).map((f) => (
          <RvButton key={f} disabled={!kit.colors.length} onClick={() => setSheet(f)}>
            {t(`fmt.${f}`)}
          </RvButton>
        ))}
      </div>

      {sheet && (
        <ExportSheet
          kit={kit}
          name={name}
          slug={slug}
          format={sheet}
          onFormat={setSheet}
          onClose={() => setSheet(null)}
          onToast={onToast}
          t={t}
        />
      )}
    </>
  );
}

function ExportSheet({
  kit,
  name,
  slug,
  format,
  onFormat,
  onClose,
  onToast,
  t,
}: {
  kit: BrandKit;
  name: string;
  slug: string;
  format: Format;
  onFormat: (f: Format) => void;
  onClose: () => void;
  onToast: (text: string) => void;
  t: T;
}) {
  const files = exportFileNames(slug);
  const css = useMemo(() => exportCss(kit, slug), [kit, slug]);
  const json = useMemo(() => exportJson(kit, slug), [kit, slug]);
  const [png, setPng] = useState<Blob | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    void palettePng(kit.colors, roleLabel(t), t('export.palette', { name })).then((blob) => {
      if (!alive) return;
      url = URL.createObjectURL(blob);
      setPng(blob);
      setPngUrl(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [kit, name, t]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      if (format === 'png') {
        if (!png) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      } else {
        await navigator.clipboard.writeText(format === 'css' ? css : json);
      }
      setCopied(true);
      onToast(t(`export.toast.${format}`));
    } catch {
      /* clipboard blocked */
    }
  };
  const download = () => {
    if (format === 'png') {
      if (png) downloadBlob(png, files.png);
    } else {
      const text = format === 'css' ? css : json;
      const type = format === 'css' ? 'text/css' : 'application/json';
      downloadBlob(new Blob([text], { type }), files[format]);
    }
  };

  return (
    <Sheet title={t('export.title')} closeLabel={t('export.close')} onClose={onClose}>
      <Segmented
        label={t('export.format')}
        value={format}
        onChange={(f) => {
          setCopied(false);
          onFormat(f);
        }}
        options={(['css', 'json', 'png'] as const).map((id) => ({ id, label: t(`fmt.${id}`) }))}
      />
      {format === 'png' ? (
        pngUrl && <img className="rp-palette" src={pngUrl} alt={t('export.palette', { name })} />
      ) : (
        <CodeBlock label={t(`fmt.${format}`)} code={format === 'css' ? css : json} />
      )}
      <div className="rp-two">
        <RvButton
          variant="primary"
          size="lg"
          icon={copied ? 'check' : 'copy'}
          onClick={() => void copy()}
        >
          {copied ? t('export.copied') : t('export.copy')}
        </RvButton>
        <RvButton size="lg" icon="download" onClick={download}>
          {t('export.download', { file: files[format] })}
        </RvButton>
      </div>
      <p className="rp-muted">{t('export.note')}</p>
    </Sheet>
  );
}

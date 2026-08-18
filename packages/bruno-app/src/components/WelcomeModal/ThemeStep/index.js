import React from 'react';
import { rgba } from 'polished';
import { IconBrightnessUp, IconMoon, IconDeviceDesktop } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import themes, { getLightThemes, getDarkThemes } from 'themes/index';
import StyledWrapper from './StyledWrapper';

const ThemePreviewBox = ({ themeId, isDark }) => {
  const themeData = themes[themeId] || themes[isDark ? 'dark' : 'light'];
  const bgColor = themeData.background.base;
  const sidebarColor = themeData.sidebar.bg;
  const lineColor = rgba(themeData.brand, 0.5);

  return (
    <div className="theme-preview-box" style={{ background: bgColor, border: `1px solid ${lineColor}` }}>
      <div className="preview-sidebar" style={{ background: sidebarColor }} />
      <div className="preview-main">
        <div className="preview-line" style={{ background: lineColor, width: '80%' }} />
        <div className="preview-line" style={{ background: lineColor, width: '55%' }} />
        <div className="preview-line" style={{ background: lineColor, width: '70%' }} />
      </div>
    </div>
  );
};

const ThemeStep = ({ storedTheme, setStoredTheme, themeVariantLight, setThemeVariantLight, themeVariantDark, setThemeVariantDark }) => {
  const { t } = useTranslation();
  const lightThemeList = getLightThemes();
  const darkThemeList = getDarkThemes();

  const themeModes = [
    { key: 'light', label: t('WELCOME.THEME_STEP.LIGHT'), icon: IconBrightnessUp },
    { key: 'dark', label: t('WELCOME.THEME_STEP.DARK'), icon: IconMoon },
    { key: 'system', label: t('WELCOME.THEME_STEP.SYSTEM'), icon: IconDeviceDesktop }
  ];

  const showLight = storedTheme === 'light' || storedTheme === 'system';
  const showDark = storedTheme === 'dark' || storedTheme === 'system';

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('WELCOME.THEME_STEP.LABEL')}</div>
      <div className="step-title">{t('WELCOME.THEME_STEP.TITLE')}</div>
      <div className="step-description">
        {t('WELCOME.THEME_STEP.DESC')}
      </div>

      <div className="theme-mode-buttons">
        {themeModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.key}
              className={`theme-mode-btn ${storedTheme === mode.key ? 'active' : ''}`}
              onClick={() => setStoredTheme(mode.key)}
            >
              <Icon size={16} stroke={1.5} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {showLight && (
        <div className="theme-variants-grid" style={{ marginBottom: showDark ? '1rem' : 0 }}>
          {lightThemeList.map((tItem) => (
            <button
              type="button"
              key={tItem.id}
              className={`theme-variant-option ${themeVariantLight === tItem.id ? 'selected' : ''}`}
              onClick={() => setThemeVariantLight(tItem.id)}
              aria-pressed={themeVariantLight === tItem.id}
            >
              <ThemePreviewBox themeId={tItem.id} isDark={false} />
              <span className="variant-name">{tItem.name}</span>
            </button>
          ))}
        </div>
      )}

      {showDark && (
        <div className="theme-variants-grid">
          {darkThemeList.map((tItem) => (
            <button
              type="button"
              key={tItem.id}
              className={`theme-variant-option ${themeVariantDark === tItem.id ? 'selected' : ''}`}
              onClick={() => setThemeVariantDark(tItem.id)}
              aria-pressed={themeVariantDark === tItem.id}
            >
              <ThemePreviewBox themeId={tItem.id} isDark={true} />
              <span className="variant-name">{tItem.name}</span>
            </button>
          ))}
        </div>
      )}
    </StyledWrapper>
  );
};

export default ThemeStep;

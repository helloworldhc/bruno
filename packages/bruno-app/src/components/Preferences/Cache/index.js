import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { savePreferences, clearHttpHttpsAgentCache } from 'providers/ReduxStore/slices/app';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import { IconEraser } from '@tabler/icons';
import { useTheme } from 'providers/Theme';
import ToggleSwitch from 'components/ToggleSwitch';
import ActionIcon from 'ui/ActionIcon';
import StyledWrapper from './StyledWrapper';
import { formatSize } from 'utils/common';
import { useTranslation } from 'react-i18next';

const Cache = () => {
  const { t } = useTranslation();
  const preferences = useSelector((state) => state.app.preferences);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { ipcRenderer } = window;

  const fileCacheEnabled = get(preferences, 'cache.file.enabled', false);
  const sslSessionEnabled = get(preferences, 'cache.sslSession.enabled', false);

  const [fileCacheSize, setFileCacheSize] = useState(null);

  const refreshFileCacheSize = useCallback(() => {
    if (!ipcRenderer) return;
    ipcRenderer
      .invoke('renderer:get-file-cache-size')
      .then((size) => setFileCacheSize(size))
      .catch(() => setFileCacheSize(null));
  }, [ipcRenderer]);

  useEffect(() => {
    refreshFileCacheSize();
  }, [refreshFileCacheSize, fileCacheEnabled]);

  const persist = (next) => {
    dispatch(savePreferences({ ...preferences, cache: next })).catch(() => {
      toast.error('Failed to update cache preferences');
    });
  };

  const handleToggleFileCache = () => {
    persist({
      ...preferences.cache,
      file: { enabled: !fileCacheEnabled }
    });
  };

  const handleToggleSslSession = () => {
    const next = !sslSessionEnabled;
    persist({
      ...preferences.cache,
      sslSession: { enabled: next }
    });
    if (!next) {
      dispatch(clearHttpHttpsAgentCache()).catch(() => {});
    }
  };

  const handleClearFileCache = () => {
    if (!ipcRenderer) return;
    ipcRenderer
      .invoke('renderer:clear-file-cache')
      .then((size) => {
        setFileCacheSize(size);
        toast.success(t('PREFERENCES.CLEAR_FILE_CACHE', 'File cache cleared'));
      })
      .catch(() => toast.error('Failed to clear file cache'));
  };

  const handleClearSslSession = () => {
    dispatch(clearHttpHttpsAgentCache())
      .then(() => toast.success(t('PREFERENCES.CLEAR_SSL_CACHE', 'SSL session cache cleared')))
      .catch(() => toast.error('Failed to clear SSL session cache'));
  };

  return (
    <StyledWrapper className="w-full">
      <div className="cache-section-title">{t('PREFERENCES.CACHE', 'Cache')}</div>

      <div className="cache-item">
        <div className="cache-item-header">
          <div className="cache-item-title-group">
            <span className="cache-item-title">{t('PREFERENCES.FILE_CACHE', 'File cache')}</span>
            <span className="beta-badge">Beta</span>
          </div>
          <ToggleSwitch
            data-testid="cache.file.enabled"
            isOn={fileCacheEnabled}
            handleToggle={handleToggleFileCache}
            size="2xs"
            activeColor={theme.primary.solid}
          />
        </div>
        <div className="cache-item-body">
          <div className="cache-item-body-text">
            <p className="cache-item-description">
              {t('PREFERENCES.FILE_CACHE_DESC', 'Loads your workspace faster by caching opened collections. Bruno refreshes the cache when your collection changes. Clearing it won\'t affect your original files.')}
            </p>
            <p className="cache-item-size">
              Cache size <strong>{fileCacheSize == null ? '—' : formatSize(fileCacheSize)}</strong>
            </p>
          </div>
          <ActionIcon
            label={t('PREFERENCES.CLEAR_CACHE', 'Clear cache')}
            onClick={handleClearFileCache}
            disabled={!fileCacheSize}
            colorOnHover={theme.colors.text.danger}
          >
            <IconEraser size={16} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>

      <div className="cache-item">
        <div className="cache-item-header">
          <div className="cache-item-title-group">
            <span className="cache-item-title">{t('PREFERENCES.SSL_CACHE', 'SSL session cache')}</span>
          </div>
          <ToggleSwitch
            data-testid="sslSession.enabled"
            isOn={sslSessionEnabled}
            handleToggle={handleToggleSslSession}
            size="2xs"
            activeColor={theme.primary.solid}
          />
        </div>
        <div className="cache-item-body">
          <div className="cache-item-body-text">
            <p className="cache-item-description">
              {t('PREFERENCES.SSL_CACHE_DESC', 'Reuses TLS sessions and connections across requests for faster handshakes. Disable to create a fresh connection for every request.')}
            </p>
          </div>
          <ActionIcon
            label={t('PREFERENCES.CLEAR_CACHE', 'Clear cache')}
            onClick={handleClearSslSession}
            colorOnHover={theme.colors.text.danger}
          >
            <IconEraser size={16} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Cache;

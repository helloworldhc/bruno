import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import { isHttpUrl } from 'utils/url/index';
import { isOpenApiSpec } from 'utils/importers/openapi-collection';
import { parseFileAsJsonOrYaml } from 'utils/importers/file-reader';

const ConnectSpecForm = ({ sourceUrl, setSourceUrl, isLoading, error, setError, onConnect }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('url');
  const fileInputRef = useRef(null);

  const features = useMemo(() => [
    t('OPENAPI.FEATURE_1', 'Detect new, modified, and removed endpoints'),
    t('OPENAPI.FEATURE_2', 'Track local changes against the spec'),
    t('OPENAPI.FEATURE_3', 'Sync collection with a single click'),
    t('OPENAPI.FEATURE_4', 'Your tests, assertions, and scripts are preserved during sync')
  ], [t]);

  return (
    <div className="setup-section">
      <div className="setup-header">
        <h2 className="setup-title">{t('OPENAPI.CONNECT_TITLE', 'Connect to OpenAPI Spec')}</h2>
        <p className="setup-description">
          {t('OPENAPI.CONNECT_DESC', 'Keep your collection synchronized with an OpenAPI specification. Changes in the spec will be detected automatically.')}
        </p>
      </div>

      <form
        className="setup-form"
        onSubmit={(e) => {
          e.preventDefault(); onConnect();
        }}
      >
        <label className="url-label">{t('OPENAPI.OPENAPI_SPECIFICATION', 'OpenAPI Specification')}</label>
        <div className="url-row">
          <div className="setup-mode-toggle">
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'url' ? 'active' : ''}`}
              onClick={() => {
                setMode('url'); setSourceUrl('');
              }}
            >
              {t('OPENAPI.URL', 'URL')}
            </button>
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'file' ? 'active' : ''}`}
              onClick={() => {
                setMode('file'); setSourceUrl('');
              }}
            >
              {t('OPENAPI.FILE', 'File')}
            </button>
          </div>

          {mode === 'url' ? (
            <input
              type="text"
              className="url-input"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://api.example.com/openapi.json"
            />
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  setSourceUrl('');
                  try {
                    const data = await parseFileAsJsonOrYaml(file);
                    if (!isOpenApiSpec(data)) {
                      setError(t('OPENAPI.INVALID_OPENAPI_3', 'The selected file is not a valid OpenAPI 3.x specification'));
                      return;
                    }
                    if (data.swagger && String(data.swagger).startsWith('2')) {
                      setError(t('OPENAPI.SWAGGER_2_NOT_SUPPORTED', 'Swagger 2.0 is not supported. Please convert your spec to OpenAPI 3.x.'));
                      return;
                    }
                    const filePath = window.ipcRenderer.getFilePath(file);
                    if (filePath) setSourceUrl(filePath);
                  } catch (err) {
                    setError(err.message || t('OPENAPI.FAILED_TO_READ_FILE', 'Failed to read the selected file'));
                  }
                }}
              />
              <button
                type="button"
                className="url-input file-pick-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {sourceUrl ? sourceUrl.split(/[\\/]/).pop() : t('OPENAPI.SELECT_FILE', 'Select File')}
              </button>
            </>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={mode === 'url' ? !isHttpUrl(sourceUrl.trim()) : !sourceUrl.trim()}
            loading={isLoading}
          >
            {t('OPENAPI.CONNECT', 'Connect')}
          </Button>
        </div>
        <p className="setup-hint">
          {mode === 'url'
            ? t('OPENAPI.HINT_URL', 'Supports OpenAPI 3.x specifications in JSON or YAML format')
            : t('OPENAPI.HINT_FILE', 'Select a local OpenAPI/Swagger JSON or YAML file')}
        </p>
        {error && (
          <p className="setup-error">{error}</p>
        )}
      </form>

      <div className="setup-features">
        {features.map((text) => (
          <div className="setup-feature" key={text}>
            <IconCheck size={16} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectSpecForm;

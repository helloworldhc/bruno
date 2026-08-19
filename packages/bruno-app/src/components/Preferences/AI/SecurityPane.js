import { useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons';
import ToggleSwitch from 'components/ToggleSwitch';
import { useTranslation } from 'react-i18next';

const BUILT_IN_HEADER_EXAMPLES = [
  'Authorization',
  'Proxy-Authorization',
  'Cookie',
  'Set-Cookie',
  'X-API-Key',
  'X-Auth-Token',
  'X-Access-Token',
  'X-CSRF-Token'
];

const normalize = (raw) => String(raw || '').trim();

/**
 * Compact editor for a case-insensitive name list. Used for both custom
 * header names and custom variable names — the shape is identical.
 */

const CHIP_MAX_LENGTH = 200;
const CHIP_MAX_COUNT = 200;

const ChipListEditor = ({ list, placeholder, onChange, addTestId, inputTestId, removeTestIdPrefix }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const values = Array.isArray(list) ? list : [];
  const atCapacity = values.length >= CHIP_MAX_COUNT;

  const handleAdd = () => {
    const value = normalize(draft);
    if (!value || value.length > CHIP_MAX_LENGTH || atCapacity) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const handleRemove = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          className="chip-input flex-1 h-7 box-border text-xs px-2.5"
          placeholder={atCapacity ? t('PREFERENCES.AI_MAX_ITEMS_REACHED', 'Maximum limit reached') : placeholder}
          value={draft}
          disabled={atCapacity}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={CHIP_MAX_LENGTH}
          data-testid={inputTestId}
        />
        <button
          type="button"
          className="btn-icon w-7 h-7 box-border inline-flex items-center justify-center cursor-pointer"
          disabled={!normalize(draft) || atCapacity}
          onClick={handleAdd}
          title={t('COMMON.ADD', 'Add')}
          aria-label={t('COMMON.ADD', 'Add')}
          data-testid={addTestId}
        >
          <IconPlus size={14} />
        </button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((item, idx) => (
            <span key={item} className="chip flex items-center gap-1.5 text-[11px] pl-2 pr-1 py-0.5">
              <span className="font-mono">{item}</span>
              <button
                type="button"
                className="chip-remove inline-flex items-center cursor-pointer p-0.5"
                onClick={() => handleRemove(idx)}
                title={t('COMMON.REMOVE', 'Remove')}
                aria-label={t('COMMON.REMOVE', 'Remove')}
                data-testid={`${removeTestIdPrefix}-${item}`}
              >
                <IconTrash size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const SecurityPane = ({
  aiEnabled,
  redactHeaders,
  redactBody,
  redactVariables,
  redactResponse,
  customRedactedHeaders,
  customRedactedVariables,
  onToggleRedactHeaders,
  onToggleRedactBody,
  onToggleRedactVariables,
  onToggleRedactResponse,
  onChangeCustomRedactedHeaders,
  onChangeCustomRedactedVariables
}) => {
  const { t } = useTranslation();

  if (!aiEnabled) {
    return (
      <div className="security-tab flex flex-col gap-3">
        <div className="ai-empty-notice px-3.5 py-3 text-xs">
          {t('PREFERENCES.AI_SECURITY_ENABLE_NOTICE', 'Turn on AI in the Configuration tab to configure redaction.')}
        </div>
      </div>
    );
  }

  return (
    <div className="security-tab flex flex-col gap-3">
      <div className="ai-empty-notice px-3.5 py-3 text-xs">
        {t('PREFERENCES.AI_SECURITY_NOTICE', 'Sensitive data is automatically redacted before context is sent to AI providers. Turn off protections if needed, or add custom headers and variables to redact.')}
      </div>

      <div className="security-card">
        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_REDACT_HEADERS', 'Redact sensitive header values')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_REDACT_HEADERS_DESC', 'Masks Authorization, cookies, API keys and other credential-bearing headers in the request context.')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactHeaders}
            handleToggle={() => onToggleRedactHeaders(!redactHeaders)}
            data-testid="ai-security-headers-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_REDACT_BODY', 'Redact sensitive body keys')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_REDACT_BODY_DESC', 'Masks values under keys like password, *_token, secret in JSON and GraphQL variables. Structure and non-sensitive fields still pass through.')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactBody}
            handleToggle={() => onToggleRedactBody(!redactBody)}
            data-testid="ai-security-body-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_REDACT_RESPONSE', 'Redact response values')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_REDACT_RESPONSE_DESC', 'Sends the response as a shape only — real values replaced with type placeholders (<string>, <number>). Turn off to send the actual response body.')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactResponse}
            handleToggle={() => onToggleRedactResponse(!redactResponse)}
            data-testid="ai-security-response-toggle"
          />
        </div>

        <div className="security-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_REDACT_VARIABLES', 'Redact secret variable values')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_REDACT_VARIABLES_DESC', 'Masks values whose names look like secrets. Variables explicitly marked secret are always redacted regardless of this switch.')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={redactVariables}
            handleToggle={() => onToggleRedactVariables(!redactVariables)}
            data-testid="ai-security-variables-toggle"
          />
        </div>
      </div>

      <div className="security-card">
        <div className="security-row flex flex-col gap-2 px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_CUSTOM_REDACTED_HEADERS', 'Custom redacted headers')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_CUSTOM_REDACTED_HEADERS_DESC', 'Exact, case-insensitive header names to always mask on top of the built-in list.')}
            </span>
          </div>
          <ChipListEditor
            list={customRedactedHeaders}
            placeholder="X-Custom-Token"
            onChange={onChangeCustomRedactedHeaders}
            inputTestId="ai-security-custom-header-input"
            addTestId="ai-security-custom-header-add"
            removeTestIdPrefix="ai-security-custom-header-remove"
          />
        </div>

        <div className="security-row flex flex-col gap-2 px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_CUSTOM_REDACTED_VARS', 'Custom redacted variables')}</span>
            <span className="security-sub text-[11px]">
              {t('PREFERENCES.AI_CUSTOM_REDACTED_VARS_DESC', 'Variable names whose values should always be masked when Bruno lists them for the model — for anything you want redacted besides values already flagged as secret.')}
            </span>
          </div>
          <ChipListEditor
            list={customRedactedVariables}
            placeholder="MY_SESSION_TOKEN"
            onChange={onChangeCustomRedactedVariables}
            inputTestId="ai-security-custom-var-input"
            addTestId="ai-security-custom-var-add"
            removeTestIdPrefix="ai-security-custom-var-remove"
          />
        </div>

        <div className="security-row flex flex-col gap-1 px-3.5 py-3">
          <span className="text-[11px] font-medium security-sub">{t('PREFERENCES.AI_BUILTIN_COVERED', 'Already covered by default')}</span>
          <div className="security-builtin flex flex-wrap gap-1.5">
            {BUILT_IN_HEADER_EXAMPLES.map((name) => (
              <span key={name} className="security-builtin-chip">{name}</span>
            ))}
            <span className="security-builtin-more text-[10.5px]">
              {t('PREFERENCES.AI_BUILTIN_MORE', 'plus any name matching token, secret, password or api_key.')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPane;

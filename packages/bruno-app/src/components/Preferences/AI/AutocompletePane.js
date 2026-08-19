import { IconChevronDown } from '@tabler/icons';
import ToggleSwitch from 'components/ToggleSwitch';
import { getPlatformModifierKey } from 'utils/common/platform';
import { useTranslation } from 'react-i18next';

const AutocompletePane = ({
  aiEnabled,
  enabled,
  model,
  triggerMode,
  availableModels,
  hasConfiguredProvider,
  onToggleEnabled,
  onChangeModel,
  onChangeTriggerMode
}) => {
  const { t } = useTranslation();

  const TRIGGER_MODES = [
    {
      value: 'aggressive',
      label: t('PREFERENCES.AI_TRIGGER_AGGRESSIVE', 'Aggressive'),
      description: t('PREFERENCES.AI_TRIGGER_AGGRESSIVE_DESC', 'Suggest after every keystroke')
    },
    {
      value: 'debounced',
      label: t('PREFERENCES.AI_TRIGGER_DEBOUNCED', 'Debounced'),
      description: t('PREFERENCES.AI_TRIGGER_DEBOUNCED_DESC', 'Suggest after you pause typing (default)')
    },
    {
      value: 'manual',
      label: t('PREFERENCES.AI_TRIGGER_MANUAL', 'Manual'),
      description: t('PREFERENCES.AI_TRIGGER_MANUAL_DESC', `Only on ${getPlatformModifierKey()}+\\`, { key: `${getPlatformModifierKey()}+\\` })
    }
  ];

  if (!aiEnabled) {
    return (
      <div className="autocomplete-tab flex flex-col gap-3">
        <div className="ai-empty-notice px-3.5 py-3 text-xs">
          {t('PREFERENCES.AI_AUTOCOMPLETE_ENABLE_NOTICE', 'Turn on AI in the Configuration tab to use autocomplete.')}
        </div>
      </div>
    );
  }

  const hasUsableModel = availableModels.length > 0;
  const isInteractive = enabled && hasUsableModel;
  const activeTrigger = TRIGGER_MODES.find((m) => m.value === (triggerMode || 'debounced'));

  // Surface the most actionable blocker first when the user can't actually
  // get suggestions yet.
  let blockerMessage = null;
  if (!hasConfiguredProvider) {
    blockerMessage = t('PREFERENCES.AI_AUTOCOMPLETE_NO_PROVIDER', 'Add a provider API key in the Configuration tab to enable autocomplete.');
  } else if (!hasUsableModel) {
    blockerMessage = t('PREFERENCES.AI_AUTOCOMPLETE_NO_MODELS', 'No models are available. Enable a model on its provider card in Configuration.');
  }

  return (
    <div className="autocomplete-tab flex flex-col gap-3">
      <div className="autocomplete-card">
        <div className="autocomplete-header flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-semibold">{t('PREFERENCES.AI_INLINE_AUTOCOMPLETE', 'Inline Autocomplete')}</span>
            <span className="autocomplete-sub text-[11px]">
              {t('PREFERENCES.AI_INLINE_AUTOCOMPLETE_DESC', 'Ghost-text suggestions in Pre-Request, Post-Response, and Tests scripts')}
            </span>
          </div>
          <ToggleSwitch
            size="xs"
            isOn={enabled}
            handleToggle={() => onToggleEnabled(!enabled)}
            data-testid="ai-autocomplete-enabled-toggle"
          />
        </div>
      </div>

      <div className={`autocomplete-card ${enabled ? '' : 'dimmed'}`}>
        {blockerMessage && (
          <div className="autocomplete-blocker px-3.5 py-3 text-[11px]">
            {blockerMessage}
          </div>
        )}

        <div className="autocomplete-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11.5px] font-medium">{t('PREFERENCES.AI_MODEL', 'Model')}</span>
            <span className="autocomplete-sub text-[10.5px]">
              {hasUsableModel
                ? t('PREFERENCES.AI_MODEL_LIGHTWEIGHT_HINT', 'Lightweight models are recommended for speed')
                : t('PREFERENCES.AI_MODEL_NONE_AVAILABLE', 'No model available yet')}
            </span>
          </div>
          <div className="model-select-wrap relative inline-flex items-center">
            <select
              className="model-select"
              value={model || ''}
              disabled={!isInteractive}
              onChange={(e) => onChangeModel(e.target.value)}
              aria-label={t('PREFERENCES.AI_MODEL', 'Model')}
              data-testid="ai-autocomplete-model-select"
            >
              <option value="">{t('PREFERENCES.AI_MODEL_AUTO', 'Auto (fastest available)')}</option>
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <IconChevronDown size={12} strokeWidth={1.75} className="model-select-chevron" />
          </div>
        </div>

        <div className="autocomplete-row flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11.5px] font-medium">{t('PREFERENCES.AI_TRIGGER', 'Trigger')}</span>
            <span className="autocomplete-sub text-[10.5px]">
              {activeTrigger?.description}
            </span>
          </div>
          <div className="trigger-pills inline-flex" role="radiogroup" aria-label={t('PREFERENCES.AI_TRIGGER', 'Trigger')}>
            {TRIGGER_MODES.map((m) => {
              const isSelected = (triggerMode || 'debounced') === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`trigger-pill ${isSelected ? 'selected' : ''}`}
                  disabled={!isInteractive}
                  onClick={() => onChangeTriggerMode(m.value)}
                  data-testid={`ai-autocomplete-trigger-${m.value}`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="autocomplete-row px-3.5 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium">{t('PREFERENCES.AI_KEYMAP', 'Keymap')}</span>
            <div className="autocomplete-keymap text-[10.5px]">
              <kbd>Tab</kbd> {t('PREFERENCES.AI_KEYMAP_ACCEPT', 'accept')} · <kbd>{getPlatformModifierKey()}</kbd>+<kbd>→</kbd> {t('PREFERENCES.AI_KEYMAP_ACCEPT_WORD', 'accept word')} · <kbd>Esc</kbd> {t('PREFERENCES.AI_KEYMAP_DISMISS', 'dismiss')} · <kbd>{getPlatformModifierKey()}</kbd>+<kbd>\</kbd> {t('PREFERENCES.AI_KEYMAP_TRIGGER', 'trigger')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutocompletePane;

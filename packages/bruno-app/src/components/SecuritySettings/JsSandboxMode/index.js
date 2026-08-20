import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { IconShieldCheck, IconCode } from '@tabler/icons';
import Dropdown from 'components/Dropdown';
import { saveCollectionSecurityConfig } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import ToolHint from 'components/ToolHint';
import { useTranslation } from 'react-i18next';

const JsSandboxMode = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState(collection?.securityConfig?.jsSandboxMode || 'safe');

  const sandboxOptions = [
    {
      key: 'safe',
      label: t('SECURITY_SETTINGS.SAFE_MODE', 'Safe Mode'),
      description: t('SECURITY_SETTINGS.SAFE_MODE_DESC', 'JavaScript code is executed in a secure sandbox and cannot access your filesystem or execute system commands.'),
      icon: IconShieldCheck,
      recommended: true
    },
    {
      key: 'developer',
      label: t('SECURITY_SETTINGS.DEVELOPER_MODE', 'Developer Mode'),
      description: t('SECURITY_SETTINGS.DEVELOPER_MODE_DESC', 'JavaScript code has access to the filesystem, can execute system commands and access sensitive information.'),
      icon: IconCode,
      warning: t('SECURITY_SETTINGS.DEVELOPER_MODE_WARNING', 'Use only if you trust the authors of the collection'),
      recommended: false
    }
  ];

  useEffect(() => {
    setSelectedMode(collection?.securityConfig?.jsSandboxMode || 'safe');
  }, [collection?.securityConfig?.jsSandboxMode]);

  const onDropdownCreate = (instance) => {
    dropdownRef.current = instance;
  };

  const closeDropdown = () => {
    dropdownRef.current?.hide();
  };

  const handleKeyDown = (e) => {
    if (e && e.key === 'Escape') {
      closeDropdown();
    }
  };

  const handleModeChange = (mode) => {
    if (!collection?.uid || mode === selectedMode) {
      return;
    }

    dispatch(
      saveCollectionSecurityConfig(collection.uid, {
        jsSandboxMode: mode
      })
    )
      .then(() => {
        setSelectedMode(mode);
      })
      .catch((err) => {
        console.error(err);
        toast.error(t('SECURITY_SETTINGS.UPDATE_ERROR', 'Failed to update sandbox mode'));
      });
  };

  const renderOption = (option) => {
    const OptionIcon = option.icon;
    const isActive = selectedMode === option.key;

    return (
      <button
        type="button"
        key={option.key}
        className={`sandbox-option ${option.key}-mode ${isActive ? 'active' : ''}`}
        onClick={() => handleModeChange(option.key)}
        role="menuitemradio"
        aria-checked={isActive}
        data-testid={`sandbox-mode-${option.key}`}
      >

        <div className="dropdown-label">
          <div className="sandbox-option-title">
            <div className="sandbox-option-radio">
              <input
                type="radio"
                name="sandbox-mode"
                value={option.key}
                checked={isActive}
              />
            </div>
            <OptionIcon size={24} strokeWidth={1.5} />
            {option.label}
            {option.recommended && <span className="recommended-badge">{t('COMMON.RECOMMENDED', 'Recommended')}</span>}
          </div>
          {option.warning && (<div><span className="developer-mode-warning">{option.warning}</span></div>)}
          <div className="sandbox-option-description">{option.description}</div>
        </div>
      </button>
    );
  };

  const triggerIcon = (
    <div>
      <ToolHint text={`${selectedMode === 'developer' ? t('SECURITY_SETTINGS.DEVELOPER_MODE', 'Developer Mode') : t('SECURITY_SETTINGS.SAFE_MODE', 'Safe Mode')}`} toolhintId="JavascriptSandboxToolhintId" place="bottom">
        <div className={`sandbox-icon ${selectedMode === 'developer' ? 'developer-mode' : 'safe-mode'}`} data-testid="sandbox-mode-selector">
          {selectedMode === 'developer' ? <IconCode size={14} strokeWidth={2} /> : <IconShieldCheck size={14} strokeWidth={2} />}
        </div>
      </ToolHint>
    </div>
  );

  return (
    <StyledWrapper className="flex" onKeyDown={handleKeyDown}>
      <Dropdown onCreate={onDropdownCreate} icon={triggerIcon} placement="bottom-start">
        <div className="sandbox-dropdown">
          <div className="sandbox-header">{t('SECURITY_SETTINGS.JS_SANDBOX_HEADER', 'JavaScript Sandbox')}</div>
          {sandboxOptions.map(renderOption)}
        </div>
      </Dropdown>
    </StyledWrapper>
  );
};

export default JsSandboxMode;

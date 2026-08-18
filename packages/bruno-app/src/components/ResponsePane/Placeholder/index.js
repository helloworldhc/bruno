import React, { useMemo } from 'react';
import { IconSend } from '@tabler/icons';
import { useSelector } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { isMacOS } from 'utils/common/platform';
import { getKeyBindingDisplayTextByOS } from 'providers/Hotkeys/keyMappings';
import { useTranslation } from 'react-i18next';

const KEY_BINDING_ACTIONS = [
  { labelKey: 'REQUEST.SEND', defaultLabel: 'Send Request', action: 'sendRequest' },
  { labelKey: 'SIDEBAR.NEW_REQUEST', defaultLabel: 'New Request', action: 'newRequest' },
  { labelKey: 'ENVIRONMENTS.CONFIGURE', defaultLabel: 'Edit Environments', action: 'editEnvironment' }
];

const Placeholder = () => {
  const { t } = useTranslation();
  const isMac = isMacOS();
  const os = isMac ? 'mac' : 'windows';
  const preferences = useSelector((state) => state.app.preferences);
  const isVerticalLayout = preferences?.layout?.responsePaneOrientation === 'vertical';
  const keyBindingActions = useMemo(() => {
    return KEY_BINDING_ACTIONS.map(({ labelKey, defaultLabel, action }) => ({
      label: t(labelKey, defaultLabel),
      action,
      shortcut: getKeyBindingDisplayTextByOS(action, preferences?.keyBindings, os)
    }));
  }, [preferences?.keyBindings, os, t]);

  const iconSize = isVerticalLayout ? 80 : 150;

  return (
    <StyledWrapper
      className={`${isVerticalLayout ? 'vertical-layout' : ''}`}
      data-testid="response-pane-shortcut-placeholder"
    >
      <div className="send-icon flex justify-center" style={{ fontSize: isVerticalLayout ? 100 : 200 }}>
        <IconSend size={iconSize} strokeWidth={1} />
      </div>
      <div className={`flex ${isVerticalLayout ? 'mt-2' : 'mt-4'}`}>
        <div className="flex flex-1 flex-col items-end px-1">
          {keyBindingActions.map(({ label, action }) => (
            <div key={action} className="px-1 py-2" data-testid={`response-placeholder-shortcut-label-${action}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col px-1">
          {keyBindingActions.map(({ action, shortcut }) => (
            <div key={action} className="px-1 py-2" data-testid={`response-placeholder-shortcut-value-${action}`}>
              {shortcut}
            </div>
          ))}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Placeholder;

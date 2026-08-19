import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const ConfirmCloseEnvironment = ({ onCancel, onCloseWithoutSave, onSaveAndClose, isGlobal, isDotEnv }) => {
  const { t } = useTranslation();
  let settingsLabel = t('ENVIRONMENTS.COLLECTION_ENV_SETTINGS', 'collection environment settings');
  if (isDotEnv) {
    settingsLabel = t('ENVIRONMENTS.DOTENV_FILE', '.env file');
  } else if (isGlobal) {
    settingsLabel = t('ENVIRONMENTS.GLOBAL_ENV_SETTINGS', 'global environment settings');
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={t('COMMON.UNSAVED_CHANGES', 'Unsaved changes')}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        handleCancel={onCancel}
        hideFooter={true}
      >
        <div className="flex items-center font-normal">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
          <h1 className="ml-2 text-lg font-medium">{t('COMMON.HOLD_ON', 'Hold on...')}</h1>
        </div>
        <div className="font-normal mt-4">
          {t('ENVIRONMENTS.UNSAVED_CHANGES_IN', 'You have unsaved changes in {{settingsLabel}}.', { settingsLabel })}
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <Button color="danger" onClick={onCloseWithoutSave} data-testid="env-unsaved-close-without-save">
              {t('COMMON.DONT_SAVE', 'Don\'t Save')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button color="secondary" variant="ghost" onClick={onCancel} data-testid="env-unsaved-cancel">
              {t('COMMON.CANCEL', 'Cancel')}
            </Button>
            <Button onClick={onSaveAndClose} data-testid="env-unsaved-save-and-close">
              {t('COMMON.SAVE', 'Save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default ConfirmCloseEnvironment;

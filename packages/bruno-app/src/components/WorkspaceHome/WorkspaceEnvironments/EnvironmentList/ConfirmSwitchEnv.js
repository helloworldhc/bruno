import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import { createPortal } from 'react-dom';
import Button from 'ui/Button';
import { useTheme } from 'providers/Theme';
import { useTranslation } from 'react-i18next';

const ConfirmSwitchEnv = ({ onCancel }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const warningColor = theme.status.warning.text;

  const modalContent = (
    <Modal
      size="md"
      title={t('COMMON.UNSAVED_CHANGES', 'Unsaved changes')}
      disableEscapeKey={true}
      disableCloseOnOutsideClick={true}
      closeModalFadeTimeout={150}
      handleCancel={onCancel}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      hideFooter={true}
    >
      <div className="flex items-center font-normal">
        <IconAlertTriangle color={warningColor} size={32} strokeWidth={1.5} />
        <h1 className="ml-2 text-lg font-semibold">{t('COMMON.HOLD_ON', 'Hold on..')}</h1>
      </div>
      <div className="font-normal mt-4">{t('ENVIRONMENTS.UNSAVED_CHANGES_ENV', 'You have unsaved changes in this environment.')}</div>

      <div className="flex justify-end mt-6">
        <div>
          <Button color="warning" onClick={onCancel}>
            {t('COMMON.CLOSE', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmSwitchEnv;

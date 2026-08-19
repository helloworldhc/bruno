import React from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DeleteDotEnvFile = ({ onClose, onConfirm, filename = '.env' }) => {
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="sm"
          title={t('ENVIRONMENTS.DELETE_DOTENV_TITLE', 'Delete {{filename}} File', { filename })}
          confirmText={t('COMMON.DELETE', 'Delete')}
          cancelText={t('COMMON.CANCEL', 'Cancel')}
          handleConfirm={handleConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          {t('ENVIRONMENTS.CONFIRM_DELETE_DOTENV', 'Are you sure you want to delete {{filename}} file?', { filename })}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteDotEnvFile;

import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { deleteGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { useTranslation } from 'react-i18next';

const DeleteEnvironment = ({ onClose, environment }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onConfirm = () => {
    dispatch(deleteGlobalEnvironment({ environmentUid: environment.uid }))
      .then(() => {
        toast.success(t('ENVIRONMENTS.ENV_DELETED_SUCCESS', 'Environment deleted successfully'));
        onClose();
      })
      .catch(() => toast.error(t('ENVIRONMENTS.ENV_DELETED_ERROR', 'An error occurred while deleting the environment')));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('ENVIRONMENTS.DELETE_ENVIRONMENT', 'Delete Environment')}
          confirmText={t('COMMON.DELETE', 'Delete')}
          cancelText={t('COMMON.CANCEL', 'Cancel')}
          handleConfirm={onConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          {t('ENVIRONMENTS.CONFIRM_DELETE_ENV', 'Are you sure you want to delete {{name}}?', { name: environment.name })}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;

import React from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import { IconFileCode } from '@tabler/icons';
import { closeApiSpecFile } from 'providers/ReduxStore/slices/apiSpec';
import { useTranslation, Trans } from 'react-i18next';

const CloseApiSpec = ({ onClose, apiSpec }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(closeApiSpecFile({ uid: apiSpec.uid }))
      .then(() => {
        toast.success(t('API_SPEC.CLOSED_SUCCESSFULLY', 'API Spec closed'));
        onClose();
      })
      .catch(() => toast.error(t('API_SPEC.ERROR_CLOSING', 'An error occurred while closing the API Spec')));
  };

  return (
    <Modal
      size="sm"
      title={t('API_SPEC.CLOSE_API_SPEC', 'Close Api Spec')}
      confirmText={t('COMMON.CLOSE', 'Close')}
      cancelText={t('COMMON.CANCEL', 'Cancel')}
      handleConfirm={onConfirm}
      handleCancel={onClose}
    >
      <div className="flex items-center">
        <IconFileCode size={18} strokeWidth={1.5} />
        <span className="ml-2 mr-4 font-semibold">{apiSpec.name}</span>
      </div>
      <div className="break-words text-xs mt-1">{apiSpec.pathname}</div>
      <div className="mt-4">
        <Trans
          i18nKey="API_SPEC.CLOSE_CONFIRM"
          defaults="Are you sure you want to close API Spec <1>{{name}}</1> in Bruno?"
          values={{ name: apiSpec.name }}
          components={{
            1: <span className="font-semibold" />
          }}
        />
      </div>
      <div className="mt-4">
        {t('API_SPEC.CLOSE_LOCATION_HINT', 'It will still be available in the file system at the above location and can be re-opened later.')}
      </div>
    </Modal>
  );
};

export default CloseApiSpec;

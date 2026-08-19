import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import Portal from 'ui/Portal';
import { useTranslation, Trans } from 'react-i18next';

const ConfirmFolderClose = ({ folder, onCancel, onCloseWithoutSave, onSaveAndClose }) => {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal
        size="md"
        title={t('REQUEST.UNSAVED_CHANGES', 'Unsaved changes')}
        confirmText={t('COMMON.SAVE_AND_CLOSE', 'Save and Close')}
        cancelText={t('COMMON.CLOSE_WITHOUT_SAVING', 'Close without saving')}
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
          <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
          <h1 className="ml-2 text-lg font-medium">{t('COMMON.HOLD_ON', 'Hold on..')}</h1>
        </div>
        <div className="font-normal mt-4">
          <Trans
            i18nKey="COLLECTION.UNSAVED_FOLDER_CHANGES_HINT"
            defaults="You have unsaved changes in <1>{{name}}</1> folder settings."
            values={{ name: folder.name }}
            components={{
              1: <span className="font-medium" />
            }}
          />
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <Button color="danger" onClick={onCloseWithoutSave}>
              {t('COMMON.DONT_SAVE', 'Don\'t Save')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button color="secondary" variant="ghost" onClick={onCancel}>
              {t('COMMON.CANCEL', 'Cancel')}
            </Button>
            <Button onClick={onSaveAndClose}>
              {t('COMMON.SAVE', 'Save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default ConfirmFolderClose;

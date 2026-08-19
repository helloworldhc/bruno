import React, { useState } from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { IconFolder } from '@tabler/icons';
import { closeWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTranslation } from 'react-i18next';

const DeleteWorkspace = ({ onClose, workspace }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const onConfirm = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await dispatch(closeWorkspaceAction(workspace.uid));
      onClose();
    } catch (error) {
      toast.error(error?.message || t('WORKSPACE.FAILED_REMOVE_WORKSPACE', 'An error occurred while removing the workspace'));
      setIsDeleting(false);
    }
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('WORKSPACE.REMOVE_WORKSPACE', 'Remove Workspace')}
        confirmText={isDeleting ? t('COMMON.LOADING', 'Removing...') : t('COMMON.REMOVE', 'Remove')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmDisabled={isDeleting}
        confirmButtonColor="danger"
      >
        <div className="flex items-center">
          <IconFolder size={18} strokeWidth={1.5} />
          <span className="ml-2 mr-4 font-semibold">{workspace?.name}</span>
        </div>
        {workspace?.pathname && (
          <div className="break-words text-xs mt-1">{workspace.pathname}</div>
        )}
        <div className="mt-4">
          {t('WORKSPACE.REMOVE_CONFIRM', 'Are you sure you want to remove workspace {{name}}?', { name: workspace?.name })}
        </div>
        <div className="mt-4">
          {t('WORKSPACE.REMOVE_HELP', 'The workspace will still be available in the file system and can be re-opened later.')}
        </div>
      </Modal>
    </Portal>
  );
};

export default DeleteWorkspace;

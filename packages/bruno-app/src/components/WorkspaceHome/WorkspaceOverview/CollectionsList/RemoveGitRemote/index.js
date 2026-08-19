import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { disconnectCollectionFromGit } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTranslation } from 'react-i18next';

const RemoveGitRemote = ({ collectionPath, collectionName, remoteUrl, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const handleConfirm = () => {
    dispatch(
      disconnectCollectionFromGit({
        workspaceUid: activeWorkspaceUid,
        collectionPath
      })
    )
      .then(() => {
        toast.success(t('WORKSPACE.GIT_REMOTE_REMOVED', 'Git remote removed'));
        onClose();
      })
      .catch(() => {
        // toast already handled in the thunk
      });
  };

  return (
    <Modal
      size="md"
      title={t('WORKSPACE.REMOVE_GIT_REMOTE', 'Remove Git Remote')}
      confirmText={t('COMMON.REMOVE', 'Remove')}
      cancelText={t('COMMON.CANCEL', 'Cancel')}
      confirmButtonColor="primary"
      handleConfirm={handleConfirm}
      handleCancel={onClose}
    >
      <div className="text-sm leading-relaxed break-words">
        <p className="m-0">
          {t('WORKSPACE.DISCONNECT_GIT_CONFIRM', 'Disconnect {{name}} from its Git remote?', { name: collectionName })}
        </p>
        {remoteUrl ? (
          <p className="mt-2 mb-0 font-mono text-xs text-muted break-all">{remoteUrl}</p>
        ) : null}
        <p className="mt-3 mb-0 text-xs text-muted">
          {t('WORKSPACE.REMOVE_GIT_REMOTE_NOTE', 'This only removes the remote URL from workspace.yml. Local collection files and any .git folder are left untouched.')}
        </p>
      </div>
    </Modal>
  );
};

export default RemoveGitRemote;

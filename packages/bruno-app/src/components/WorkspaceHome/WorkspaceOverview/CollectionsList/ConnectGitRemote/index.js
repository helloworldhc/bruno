import React, { useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { isGitRepositoryUrl } from 'utils/git';
import { connectCollectionToGit } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTranslation } from 'react-i18next';

const ConnectGitRemote = ({ collectionPath, collectionName, initialUrl = '', onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      remoteUrl: initialUrl
    },
    validationSchema: Yup.object({
      remoteUrl: Yup.string()
        .trim()
        .required(t('WORKSPACE.GIT_REMOTE_URL_REQ', 'Git remote URL is required'))
        .test('is-git-url', t('WORKSPACE.ENTER_VALID_GIT_URL', 'Enter a valid Git URL'), (value) => isGitRepositoryUrl(value))
    }),
    onSubmit: (values) => {
      dispatch(
        connectCollectionToGit({
          workspaceUid: activeWorkspaceUid,
          collectionPath,
          remoteUrl: values.remoteUrl.trim()
        })
      )
        .then(() => {
          toast.success(t('WORKSPACE.GIT_REMOTE_CONNECTED', 'Git remote connected'));
          onClose();
        })
        .catch(() => {
          // toast already handled in the thunk
        });
    }
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const title = initialUrl ? t('WORKSPACE.UPDATE_GIT_REMOTE', 'Update Git Remote') : t('WORKSPACE.CONNECT_TO_GIT', 'Connect to Git');
  const confirmText = initialUrl ? t('COMMON.UPDATE', 'Update') : t('COMMON.CONNECT', 'Connect');

  return (
    <Modal
      size="md"
      title={title}
      confirmText={confirmText}
      cancelText={t('COMMON.CANCEL', 'Cancel')}
      handleConfirm={() => formik.handleSubmit()}
      handleCancel={onClose}
    >
      <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
        {collectionName ? (
          <div className="text-sm text-muted mb-3 leading-relaxed break-words space-y-2">
            <p className="m-0">
              {t('WORKSPACE.LINKING_TO_GIT_DESC', 'Linking {{name}} to a remote Git repository.', { name: collectionName })}
            </p>
            <p className="m-0">
              {t('WORKSPACE.WORKSPACE_YML_NOTE', 'The URL is saved in workspace.yml only. Your collection files on disk are not modified.')}
            </p>
          </div>
        ) : null}
        <div>
          <label htmlFor="remoteUrl" className="block font-medium">
            {t('WORKSPACE.GIT_REMOTE_URL', 'Git Remote URL')}
          </label>
          <input
            id="remoteUrl"
            type="text"
            name="remoteUrl"
            ref={inputRef}
            className="block textbox mt-2 w-full"
            placeholder="https://github.com/owner/repo"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.remoteUrl || ''}
          />
          {formik.touched.remoteUrl && formik.errors.remoteUrl ? (
            <div className="text-red-500">{formik.errors.remoteUrl}</div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default ConnectGitRemote;

import React, { useRef, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { IconArrowBackUp, IconEdit } from '@tabler/icons';
import Modal from 'components/Modal';
import Help from 'components/Help';
import PathDisplay from 'components/PathDisplay/index';
import { createWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { multiLineMsg } from 'utils/common/index';
import { formatIpcError } from 'utils/common/error';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';

const CreateWorkspace = ({ onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const dispatch = useDispatch();
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const preferences = useSelector((state) => state.app.preferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const defaultLocation = get(preferences, 'general.defaultLocation', '');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      workspaceName: '',
      workspaceFolderName: '',
      workspaceLocation: defaultLocation
    },
    validationSchema: Yup.object({
      workspaceName: Yup.string()
        .trim()
        .min(1, t('WORKSPACE.WORKSPACE_NAME_EMPTY', 'Workspace name can\'t be empty'))
        .max(255, 'Must be 255 characters or less')
        .required(t('WORKSPACE.WORKSPACE_NAME_REQ', 'Workspace name is required'))
        .test('unique-name', t('WORKSPACE.WORKSPACE_NAME_EXISTS', 'A workspace with this name already exists'), function (value) {
          if (!value) return true;

          return !workspaces.some((w) =>
            !w.isCreating && w.name && w.name.toLowerCase() === value.toLowerCase());
        }),
      workspaceFolderName: Yup.string()
        .min(1, 'Must be at least 1 character')
        .max(255, 'Must be 255 characters or less')
        .test('is-valid-folder-name', function (value) {
          const isValid = validateName(value);
          return isValid ? true : this.createError({ message: validateNameError(value) });
        })
        .required(t('WORKSPACE.FOLDER_NAME_REQ', 'Folder name is required')),
      workspaceLocation: Yup.string().min(1, t('WORKSPACE.LOCATION_REQ', 'Location is required')).required(t('WORKSPACE.LOCATION_REQ', 'Location is required'))
    }),
    onSubmit: async (values) => {
      if (isSubmitting) return;

      try {
        setIsSubmitting(true);

        await dispatch(createWorkspaceAction(values.workspaceName.trim(), values.workspaceFolderName, values.workspaceLocation));
        toast.success(t('WORKSPACE.WORKSPACE_CREATED', 'Workspace created!'));
        onClose();
      } catch (error) {
        toast.error(multiLineMsg(t('WORKSPACE.FAILED_CREATE_WORKSPACE', 'An error occurred while creating the workspace'), formatIpcError(error)));
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          formik.setFieldValue('workspaceLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('workspaceLocation', '');
        console.error(error);
      });
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <Modal
      size="md"
      title={t('WORKSPACE.CREATE_WORKSPACE', 'Create Workspace')}
      description={t('WORKSPACE.CREATE_DESC', 'Give your new workspace a name and choose its type to get started.')}
      confirmText={isSubmitting ? t('COMMON.LOADING', 'Creating...') : t('WORKSPACE.CREATE_WORKSPACE', 'Create Workspace')}
      cancelText={t('COMMON.CANCEL', 'Cancel')}
      handleConfirm={formik.handleSubmit}
      handleCancel={onClose}
      style="new"
      confirmDisabled={isSubmitting}
    >
      <div>
        <form className="bruno-form" onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="workspaceName" className="block font-semibold mb-2">
              {t('COMMON.NAME', 'Name')}
            </label>
            <input
              id="workspace-name"
              type="text"
              name="workspaceName"
              ref={inputRef}
              className="block textbox w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => {
                const workspaceName = e.target.value;
                if (!isEditing) {
                  formik.setValues((values) => ({
                    ...values,
                    workspaceName,
                    workspaceFolderName: sanitizeName(workspaceName)
                  }));
                  return;
                }

                formik.handleChange(e);
              }}
              value={formik.values.workspaceName || ''}
            />
            {formik.touched.workspaceName && formik.errors.workspaceName ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceName}</div>
            ) : null}
          </div>

          {formik.values.workspaceName?.trim()?.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="workspaceFolderName" className="flex items-center font-semibold">
                  {t('WORKSPACE.FOLDER_NAME', 'Folder Name')}
                  <Help width="300">
                    <p>
                      {t('WORKSPACE.FOLDER_NAME_HELP_1', 'The name of the folder used to store the workspace.')}
                    </p>
                    <p className="mt-2">
                      {t('WORKSPACE.FOLDER_NAME_HELP_2', 'You can choose a folder name different from your workspace\'s name or one compatible with filesystem rules.')}
                    </p>
                  </Help>
                </label>
                {isEditing ? (
                  <IconArrowBackUp
                    className="cursor-pointer opacity-50 hover:opacity-80"
                    size={16}
                    strokeWidth={1.5}
                    onClick={() => setIsEditing(false)}
                  />
                ) : (
                  <IconEdit
                    className="cursor-pointer opacity-50 hover:opacity-80"
                    size={16}
                    strokeWidth={1.5}
                    onClick={() => setIsEditing(true)}
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  id="workspace-folder-name"
                  type="text"
                  name="workspaceFolderName"
                  className="block textbox w-full"
                  onChange={formik.handleChange}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={formik.values.workspaceFolderName || ''}
                />
              ) : (
                <PathDisplay baseName={formik.values.workspaceFolderName} />
              )}
              {formik.touched.workspaceFolderName && formik.errors.workspaceFolderName ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceFolderName}</div>
              ) : null}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="workspaceLocation" className="font-semibold mb-2 flex items-center">
              {t('COMMON.LOCATION', 'Location')}
              <Help>
                <p>
                  {t('WORKSPACE.LOCATION_HELP_1', 'Bruno stores your workspaces on your computer\'s filesystem.')}
                </p>
                <p className="mt-2">
                  {t('WORKSPACE.LOCATION_HELP_2', 'Choose the location where you want to store this workspace.')}
                </p>
              </Help>
            </label>
            <input
              id="workspace-location"
              type="text"
              name="workspaceLocation"
              readOnly={true}
              className="block textbox mt-2 w-full cursor-pointer"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formik.values.workspaceLocation || ''}
              onClick={browse}
            />
            {formik.touched.workspaceLocation && formik.errors.workspaceLocation ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceLocation}</div>
            ) : null}
            <div className="mt-1">
              <span
                className="text-link cursor-pointer hover:underline"
                onClick={browse}
              >
                {t('COMMON.BROWSE', 'Browse')}
              </span>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateWorkspace;

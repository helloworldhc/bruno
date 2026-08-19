import React, { useEffect, useRef } from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal/index';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { renameGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { validateName, validateNameError } from 'utils/common/regex';
import { useTranslation } from 'react-i18next';

const RenameEnvironment = ({ onClose, environment }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const globalEnvs = useSelector((state) => state?.globalEnvironments?.globalEnvironments);
  const inputRef = useRef();

  const validateEnvironmentName = (name) => {
    const trimmedName = name?.toLowerCase().trim();
    return (globalEnvs || []).every((env) =>
      env.uid === environment.uid || env?.name?.toLowerCase().trim() !== trimmedName);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: environment.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, 'must be at least 1 character')
        .max(255, 'Must be 255 characters or less')
        .test('is-valid-filename', function (value) {
          const isValid = validateName(value);
          return isValid ? true : this.createError({ message: validateNameError(value) });
        })
        .required(t('ENVIRONMENTS.NAME_REQUIRED', 'Name is required'))
        .test('duplicate-name', t('ENVIRONMENTS.GLOBAL_ENV_EXISTS', 'Global environment already exists'), validateEnvironmentName)
    }),
    onSubmit: (values) => {
      if (values.name === environment.name) {
        return;
      }
      dispatch(renameGlobalEnvironment({ name: values.name, environmentUid: environment.uid }))
        .then(() => {
          toast.success(t('ENVIRONMENTS.ENV_RENAMED_SUCCESS', 'Environment renamed successfully'));
          onClose();
        })
        .catch((error) => {
          toast.error(t('ENVIRONMENTS.ENV_RENAME_ERROR', 'An error occurred while renaming the environment'));
          console.error(error);
        });
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => {
    formik.handleSubmit();
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('ENVIRONMENTS.RENAME_ENVIRONMENT', 'Rename Environment')}
        confirmText={t('COMMON.RENAME', 'Rename')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={onSubmit}
        handleCancel={onClose}
      >
        <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="environment-name" className="block font-semibold">
              {t('ENVIRONMENTS.NAME', 'Environment Name')}
            </label>
            <input
              id="environment-name"
              type="text"
              name="name"
              ref={inputRef}
              className="block textbox mt-2 w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={formik.handleChange}
              value={formik.values.name || ''}
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500">{formik.errors.name}</div>
            ) : null}
          </div>
        </form>
      </Modal>
    </Portal>
  );
};

export default RenameEnvironment;

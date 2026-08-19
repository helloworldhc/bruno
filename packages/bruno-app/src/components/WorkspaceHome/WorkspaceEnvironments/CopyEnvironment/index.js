import Modal from 'components/Modal/index';
import Portal from 'components/Portal/index';
import { useFormik } from 'formik';
import { copyGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

const CopyEnvironment = ({ environment, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef();
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: environment.name + ' - Copy'
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, 'must be at least 1 character')
        .max(50, 'must be 50 characters or less')
        .required('name is required')
    }),
    onSubmit: (values) => {
      dispatch(copyGlobalEnvironment({ name: values.name, environmentUid: environment.uid }))
        .then(() => {
          toast.success(t('ENVIRONMENTS.ENV_CREATED_SUCCESS', 'Environment created!'));
          onClose();
        })
        .catch((error) => {
          toast.error(t('ENVIRONMENTS.ENV_CREATED_ERROR', 'An error occurred while creating the environment'));
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
        title={t('ENVIRONMENTS.COPY_ENVIRONMENT', 'Copy Environment')}
        confirmText={t('COMMON.COPY', 'Copy')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={onSubmit}
        handleCancel={onClose}
      >
        <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="environment-name" className="block font-semibold">
              {t('ENVIRONMENTS.NEW_ENVIRONMENT_NAME', 'New Environment Name')}
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

export default CopyEnvironment;

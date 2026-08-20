import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import { deleteMockServerInstance } from 'utils/mock-server/mock-server-instances';

const DeleteMockServerModal = ({ instance, onClose, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleConfirm = async () => {
    try {
      await dispatch(deleteMockServerInstance(instance.uid));
      toast.success(t('MOCK_SERVER.DELETED', 'Mock server deleted'));
      onDeleted?.();
      onClose();
    } catch {
      toast.error(t('MOCK_SERVER.DELETE_ERROR', 'Failed to delete mock server'));
    }
  };

  return (
    <MockConfirmModal
      title={t('MOCK_SERVER.DELETE_MOCK_SERVER', 'Delete Mock Server')}
      confirmText={t('COMMON.DELETE', 'Delete')}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmButtonColor="danger"
      dataTestId="delete-mock-server-modal"
    >
      {t('MOCK_SERVER.CONFIRM_DELETE_SERVER', 'Are you sure you want to delete')} <span className="font-medium">{instance.name}</span>?
      {instance.sourceType === 'spec' ? (
        <div className="text-xs mt-3 opacity-70">{t('MOCK_SERVER.DELETE_SPEC_NOTICE', 'This removes the mock server configuration only. Your API spec file is not deleted.')}</div>
      ) : null}
    </MockConfirmModal>
  );
};

export default DeleteMockServerModal;

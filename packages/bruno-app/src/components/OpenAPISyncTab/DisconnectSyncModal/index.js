import { useTranslation } from 'react-i18next';
import Button from 'ui/Button';
import Modal from 'components/Modal';

const DisconnectSyncModal = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      size="sm"
      title={t('OPENAPI.DISCONNECT_SYNC', 'Disconnect Sync')}
      hideFooter={true}
      handleCancel={onClose}
    >
      <div className="disconnect-modal">
        <p className="disconnect-message">
          <>{t('OPENAPI.CONFIRM_DISCONNECT_TITLE', 'Are you sure you want to disconnect OpenAPI sync?')} </> <br /> <br />
          <>{t('OPENAPI.CONFIRM_DISCONNECT_DESC', 'This will only disconnect the sync configuration. Your collection will remain intact.')}</>
        </p>
        <div className="disconnect-actions">
          <Button variant="ghost" color="secondary" onClick={onClose}>
            {t('COMMON.CANCEL', 'Cancel')}
          </Button>
          <Button color="danger" onClick={onConfirm}>
            {t('OPENAPI.DISCONNECT', 'Disconnect')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DisconnectSyncModal;

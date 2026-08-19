import React from 'react';
import { IconDownload, IconCopy, IconEye, IconAlertTriangle } from '@tabler/icons';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import StyledWrapper from './StyledWrapper';
import { formatSize } from 'utils/common/index';
import Button from 'ui/Button/index';
import { useTranslation } from 'react-i18next';

const LargeResponseWarning = ({ item, responseSize, onRevealResponse }) => {
  const { t } = useTranslation();
  const { ipcRenderer } = window;
  const response = item.response || {};

  const downloadResponseToFile = () => {
    return new Promise((resolve, reject) => {
      ipcRenderer
        .invoke('renderer:save-response-to-file', response, item.requestSent.url, item.pathname)
        .then((result) => {
          if (result && result.success) {
            toast.success(t('RESPONSE.DOWNLOADED_TO_FILE', 'Response downloaded to file'));
          }
          resolve();
        })
        .catch((err) => {
          toast.error(get(err, 'error.message') || 'Something went wrong!');
          reject(err);
        });
    });
  };

  const copyResponse = () => {
    try {
      const textToCopy = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2);

      navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success(t('RESPONSE.COPIED_TO_CLIPBOARD', 'Response copied to clipboard'));
      }).catch(() => {
        toast.error(t('RESPONSE.FAILED_TO_COPY', 'Failed to copy response'));
      });
    } catch (error) {
      toast.error(t('RESPONSE.FAILED_TO_COPY', 'Failed to copy response'));
    }
  };

  return (
    <StyledWrapper>
      <div className="warning-container">
        <div className="warning-icon">
          <IconAlertTriangle size={45} strokeWidth={2} />
        </div>
        <div className="warning-content">
          <div className="warning-title">
            {t('RESPONSE.LARGE_RESPONSE_WARNING', 'Large Response Warning')}
          </div>
          <div className="warning-description">
            {t('RESPONSE.LARGE_RESPONSE_DESC', 'Handling responses over {{limit}} could degrade performance.', { limit: formatSize(10 * 1024 * 1024) })}
            <br />
            {t('RESPONSE.CURRENT_RESPONSE_SIZE', 'Size of current response: {{size}}', { size: formatSize(responseSize) })}
          </div>
        </div>
      </div>
      <div className="warning-actions">
        <Button
          icon={<IconEye size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={onRevealResponse}
          title={t('RESPONSE.SHOW_RESPONSE_CONTENT', 'Show response content')}
          color="secondary"
          size="sm"
        >
          {t('COMMON.VIEW', 'View')}
        </Button>
        <Button
          icon={<IconDownload size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={downloadResponseToFile}
          disabled={!response.dataBuffer}
          title={t('RESPONSE.DOWNLOAD_RESPONSE_TO_FILE', 'Download response to file')}
          color="secondary"
          size="sm"
        >
          {t('COMMON.DOWNLOAD', 'Download')}
        </Button>
        <Button
          icon={<IconCopy size={18} strokeWidth={1.5} />}
          iconPosition="left"
          onClick={copyResponse}
          disabled={!response.data}
          title={t('RESPONSE.COPY_RESPONSE_TO_CLIPBOARD', 'Copy response to clipboard')}
          color="secondary"
          size="sm"
        >
          {t('COMMON.COPY', 'Copy')}
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default LargeResponseWarning;

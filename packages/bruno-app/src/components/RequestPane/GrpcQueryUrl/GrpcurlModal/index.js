import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { IconCheck, IconCopy } from '@tabler/icons';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import Modal from 'components/Modal/index';
import CodeEditor from 'components/CodeEditor';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const GrpcurlModal = ({ isOpen, onClose, command }) => {
  const { t } = useTranslation();
  const { displayedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const preferences = useSelector((state) => state.app.preferences);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success(t('GRPC.COMMAND_COPIED', 'Command copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('GRPC.FAILED_COPY_COMMAND', 'Failed to copy command'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      handleCancel={onClose}
      title={(
        <div className="flex items-center gap-2">
          <span>{t('GRPC.GENERATE_GRPCURL_TITLE', 'Generate gRPCurl Command')}</span>
        </div>
      )}
      size="lg"
      hideFooter={true}
    >
      <div>
        <div className="flex w-full min-h-[400px]">
          <div className="flex-grow relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                icon={copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
              />
            </div>
            <CodeEditor
              value={command}
              theme={displayedTheme}
              readOnly={true}
              mode="shell"
              font={get(preferences, 'font.codeFont', 'default')}
              fontSize={get(preferences, 'font.codeFontSize')}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GrpcurlModal;

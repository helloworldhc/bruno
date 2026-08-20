import React from 'react';
import { IconLoader2 } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const RequestTabPanelLoading = ({ name }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
      <IconLoader2 className="animate-spin" size={24} strokeWidth={1.5} />
      <span>
        {name
          ? t('REQUEST_TAB.LOADING_NAMED_REQUEST', 'Loading "{{name}}"...', { name })
          : t('REQUEST_TAB.LOADING_REQUEST', 'Loading request...')}
      </span>
    </div>
  );
};

export default RequestTabPanelLoading;

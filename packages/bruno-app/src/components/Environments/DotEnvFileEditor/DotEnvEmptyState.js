import React from 'react';
import { IconFileOff } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const DotEnvEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <IconFileOff size={48} strokeWidth={1.5} />
      <div className="title">{t('ENVIRONMENTS.NO_DOTENV_FILE', 'No .env File')}</div>
      <div className="description">
        {t('ENVIRONMENTS.NO_DOTENV_FILE_DESC', 'Add a variable below to create a .env file in this location.')}
      </div>
    </div>
  );
};

export default DotEnvEmptyState;

import React from 'react';
import { IconPlus, IconDownload, IconFileImport, IconSend } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const GetStartedStep = ({ onCreateCollection, onImportCollection, onOpenCollection, onStartRequest }) => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('WELCOME.GET_STARTED_STEP.LABEL')}</div>
      <div className="step-title">{t('WELCOME.GET_STARTED_STEP.TITLE')}</div>
      <div className="step-description">
        {t('WELCOME.GET_STARTED_STEP.DESC')}
      </div>

      <div className="primary-actions">
        <button className="primary-action-card" onClick={onCreateCollection}>
          <div className="card-icon">
            <IconPlus size={20} stroke={1.5} />
          </div>
          <div className="card-title">{t('WELCOME.GET_STARTED_STEP.CREATE_TITLE')}</div>
          <div className="card-desc">{t('WELCOME.GET_STARTED_STEP.CREATE_DESC')}</div>
        </button>

        <button className="primary-action-card" onClick={onImportCollection}>
          <div className="card-icon">
            <IconDownload size={20} stroke={1.5} />
          </div>
          <div className="card-title">{t('WELCOME.GET_STARTED_STEP.IMPORT_TITLE')}</div>
          <div className="card-desc">{t('WELCOME.GET_STARTED_STEP.IMPORT_DESC')}</div>
        </button>
      </div>

      <div className="secondary-actions">
        <button className="secondary-action" onClick={onOpenCollection}>
          <span className="secondary-icon">
            <IconFileImport size={16} stroke={1.5} />
          </span>
          <div>
            <div className="secondary-label">{t('WELCOME.GET_STARTED_STEP.OPEN_TITLE')}</div>
            <div className="secondary-desc">{t('WELCOME.GET_STARTED_STEP.OPEN_DESC')}</div>
          </div>
        </button>
        <button className="secondary-action" onClick={onStartRequest}>
          <span className="secondary-icon">
            <IconSend size={16} stroke={1.5} />
          </span>
          <div>
            <div className="secondary-label">{t('WELCOME.GET_STARTED_STEP.START_REQUEST_TITLE')}</div>
            <div className="secondary-desc">{t('WELCOME.GET_STARTED_STEP.START_REQUEST_DESC')}</div>
          </div>
        </button>
      </div>
    </StyledWrapper>
  );
};

export default GetStartedStep;

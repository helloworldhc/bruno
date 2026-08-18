import React from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const StorageStep = ({ collectionLocation, onBrowse }) => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('WELCOME.STORAGE_STEP.LABEL')}</div>
      <div className="step-title">{t('WELCOME.STORAGE_STEP.TITLE')}</div>
      <div className="step-description">
        {t('WELCOME.STORAGE_STEP.DESC')}
      </div>

      <div className="location-input-group">
        <div
          className="location-path-display"
          onClick={onBrowse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onBrowse();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {collectionLocation ? (
            <span className="path-text">{collectionLocation}</span>
          ) : (
            <span className="path-text path-placeholder">{t('WELCOME.STORAGE_STEP.PLACEHOLDER')}</span>
          )}
          <span className="browse-label">{t('COMMON.BROWSE')}</span>
        </div>
      </div>
      <div className="location-hint">
        {t('WELCOME.STORAGE_STEP.HINT')}
      </div>
    </StyledWrapper>
  );
};

export default StorageStep;

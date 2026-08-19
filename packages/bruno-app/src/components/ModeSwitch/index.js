import React from 'react';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const ModeSwitch = ({ isMarkdownMode, onToggle, className, ...props }) => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className={className} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className={`${!isMarkdownMode ? 'is-active' : ''}`}
        onClick={() => { if (isMarkdownMode) onToggle(); }}
      >
        <span className="mode-text">{t('COMMON.RICH_TEXT', 'Rich Text')}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${isMarkdownMode ? 'is-active' : ''}`}
        onClick={() => { if (!isMarkdownMode) onToggle(); }}
      >
        <span className="mode-text">{t('COMMON.MARKDOWN', 'Markdown')}</span>
      </Button>
    </StyledWrapper>
  );
};

export default ModeSwitch;

import React from 'react';
import {
  IconFolder as IconFolderTabler,
  IconGitFork,
  IconLock,
  IconRocket
} from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const WelcomeStep = () => {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: IconFolderTabler,
      title: t('WELCOME.HIGHLIGHTS.FILESYSTEM_TITLE'),
      desc: t('WELCOME.HIGHLIGHTS.FILESYSTEM_DESC')
    },
    {
      icon: IconGitFork,
      title: t('WELCOME.HIGHLIGHTS.GIT_FRIENDLY_TITLE'),
      desc: t('WELCOME.HIGHLIGHTS.GIT_FRIENDLY_DESC')
    },
    {
      icon: IconLock,
      title: t('WELCOME.HIGHLIGHTS.PRIVACY_TITLE'),
      desc: t('WELCOME.HIGHLIGHTS.PRIVACY_DESC')
    },
    {
      icon: IconRocket,
      title: t('WELCOME.HIGHLIGHTS.LIGHTWEIGHT_TITLE'),
      desc: t('WELCOME.HIGHLIGHTS.LIGHTWEIGHT_DESC')
    }
  ];

  return (
    <StyledWrapper className="step-body">
      <div className="highlights">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="highlight-item">
              <div className="highlight-icon">
                <Icon size={18} stroke={1.5} />
              </div>
              <div>
                <div className="highlight-title">{item.title}</div>
                <div className="highlight-desc">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </StyledWrapper>
  );
};

export default WelcomeStep;

import React from 'react';
import IconAlertTriangleFilled from '../Icons/IconAlertTriangleFilled';
import StyledWrapper from './StyledWrapper';
import { useTranslation, Trans } from 'react-i18next';

const DeprecationWarning = ({ featureName, learnMoreUrl }) => {
  const { t } = useTranslation();
  return (
    <StyledWrapper>
      <div className="deprecation-warning">
        <IconAlertTriangleFilled className="warning-icon" size={16} />
        <span className="warning-text">
          <Trans
            i18nKey="DEPRECATION_WARNING.TEXT"
            defaults="{{featureName}} will be removed in <0>v3.0.0</0>. They are deprecated and will no longer be supported. Learn more in <1>this post</1> or contact us at <2>support@usebruno.com</2> with questions."
            values={{ featureName }}
            components={[
              <strong key="version" />,
              <a key="post" href={learnMoreUrl} target="_blank" rel="noreferrer" />,
              <a key="email" href="mailto:support@usebruno.com" />
            ]}
          />
        </span>
      </div>
    </StyledWrapper>
  );
};

export default DeprecationWarning;

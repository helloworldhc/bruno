import React from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button/index';

import { withTranslation } from 'react-i18next';

class QueryBuilderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[QueryBuilder] Unexpected render error:', error, errorInfo);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const t = this.props.t || ((key, fallback) => fallback);
      return (
        <StyledWrapper>
          <div className="schema-empty-state">
            <IconAlertTriangle size={32} strokeWidth={1.5} className="empty-state-icon warning" />
            <div className="empty-state-title">{t('COMMON.SOMETHING_WENT_WRONG', 'Something went wrong')}</div>
            <div className="empty-state-description">
              {t('QUERY_BUILDER.ERROR_DESC', 'The Query Builder encountered an unexpected error. Try reloading the schema or manually using the editor.')}
            </div>
            <Button color="secondary" onClick={this.reset}>
              {t('COMMON.TRY_AGAIN', 'Try Again')}
            </Button>
          </div>
        </StyledWrapper>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(QueryBuilderErrorBoundary);

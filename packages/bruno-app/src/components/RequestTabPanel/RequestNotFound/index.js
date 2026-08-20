import React, { useEffect, useState } from 'react';
import { closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import ErrorBanner from 'ui/ErrorBanner';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const RequestNotFound = ({ itemUid }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const closeTab = () => {
    dispatch(
      closeTabs({
        tabUids: [itemUid]
      })
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowErrorMessage(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!showErrorMessage) {
    return null;
  }

  const errors = [
    {
      title: t('REQUEST_TAB_PANEL.REQUEST_NOT_FOUND', 'Request no longer exists'),
      message: t('REQUEST_TAB_PANEL.REQUEST_NOT_FOUND_MSG', 'This can happen when the file associated with this request was deleted on your filesystem.')
    }
  ];

  return (
    <div className="mt-6 px-6">
      <ErrorBanner errors={errors} className="mb-4" />
      <Button size="md" color="secondary" variant="ghost" onClick={closeTab}>
        {t('COMMON.CLOSE_TAB', 'Close Tab')}
      </Button>
    </div>
  );
};

export default RequestNotFound;

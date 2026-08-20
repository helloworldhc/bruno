import { useState, useEffect, useMemo } from 'react';
import { IconLoader2 } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const FullscreenLoader = ({ isLoading }) => {
  const { t } = useTranslation();
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = useMemo(() => [
    t('IMPORT_COLLECTION.PROCESSING', 'Processing collection...'),
    t('IMPORT_COLLECTION.ANALYZING', 'Analyzing requests...'),
    t('IMPORT_COLLECTION.TRANSLATING_SCRIPTS', 'Translating scripts...'),
    t('IMPORT_COLLECTION.PREPARING', 'Preparing collection...'),
    t('IMPORT_COLLECTION.ALMOST_DONE', 'Almost done...')
  ], [t]);

  useEffect(() => {
    if (!isLoading) return;

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    setLoadingMessage(loadingMessages[0]);

    return () => clearInterval(interval);
  }, [isLoading, loadingMessages]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center p-8 rounded-lg bg-white dark:bg-zinc-800 shadow-lg max-w-md text-center">
        <IconLoader2 className="animate-spin h-12 w-12 mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">{loadingMessage}</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          {t('IMPORT_COLLECTION.TAKE_MOMENT_NOTICE', 'This may take a moment depending on the collection size')}
        </p>
      </div>
    </div>
  );
};

export default FullscreenLoader;

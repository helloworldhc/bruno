import React, { useState } from 'react';
import { isGitRepositoryUrl } from 'utils/git';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const GitHubTab = ({
  handleSubmit,
  setErrorMessage
}) => {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState('');

  const handleGitRepositoryImport = (url) => {
    if (!isGitRepositoryUrl(url)) {
      setErrorMessage(t('IMPORT_COLLECTION.ENTER_VALID_GIT_URL', 'Please enter a valid git repository URL'));
      return;
    }
    handleSubmit({ repositoryUrl: url, type: 'git-repository' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      handleGitRepositoryImport(urlInput.trim());
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="flex gap-2">
        <input
          id="gitUrlInput"
          data-testid="git-url-input"
          type="text"
          value={urlInput}
          autoFocus
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={t('IMPORT_COLLECTION.GIT_URL_PLACEHOLDER', 'Enter Git repository URL')}
          className="flex-1 px-3 py-1 textbox"
        />
        <Button
          type="submit"
          id="clone-git-button"
          disabled={!urlInput.trim()}
          variant="filled"
          color="primary"
          style={{ height: '100%' }}
        >
          {t('COMMON.CLONE', 'Clone')}
        </Button>
      </div>
    </form>
  );
};

export default GitHubTab;

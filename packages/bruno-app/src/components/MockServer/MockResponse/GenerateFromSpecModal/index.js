import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';

const GenerateFromSpecModal = ({ specName, onClose, onConfirm, isGenerating }) => {
  const { t } = useTranslation();
  const [generateFromSchema, setGenerateFromSchema] = useState(true);

  return (
    <MockConfirmModal
      size="md"
      title={t('MOCK_SERVER.GENERATE_FROM_API_SPEC', 'Generate from API Spec')}
      confirmText={isGenerating ? t('MOCK_SERVER.GENERATING', 'Generating...') : t('MOCK_SERVER.GENERATE', 'Generate')}
      onConfirm={() => onConfirm({ generateFromSchema })}
      onClose={onClose}
      confirmDisabled={isGenerating}
      dataTestId="mock-response-generate-from-spec-modal"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">
          {t('MOCK_SERVER.GENERATE_FROM_SPEC_DESC_1', 'Generate mock responses from')}
          {' '}
          <span className="font-medium">{specName || t('MOCK_SERVER.THIS_API_SPEC', 'this API spec')}</span>
          ? {t('MOCK_SERVER.GENERATE_FROM_SPEC_DESC_2', 'Each operation status code becomes its own mock response. The lowest status code is matched first by default; add rules to route other variants.')}
        </p>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={generateFromSchema}
            onChange={(event) => setGenerateFromSchema(event.target.checked)}
            data-testid="mock-response-generate-from-schema-checkbox"
          />
          <span>
            {t('MOCK_SERVER.GENERATE_BODIES_FROM_SCHEMA', 'Generate response bodies from schema')}
            <span className="block text-xs opacity-70 mt-1">
              {t('MOCK_SERVER.GENERATE_BODIES_HELP', 'Uses faker-backed sample data when a response schema is available. Uncheck to create empty JSON bodies.')}
            </span>
          </span>
        </label>
      </div>
    </MockConfirmModal>
  );
};

export default GenerateFromSpecModal;

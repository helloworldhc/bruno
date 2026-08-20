import { useTheme } from '../../../../providers/Theme';
import { useDispatch } from 'react-redux';
import { setIsOpeningCollection } from 'providers/ReduxStore/slices/app';

import styled from 'styled-components';
import StyledWrapper from './StyledWrapper';
import { useTranslation, Trans } from 'react-i18next';

const LinkStyle = styled.span`
  color: ${(props) => props.theme['text-link']};
`;

const CreateOrOpenCollection = ({ onCreateClick }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const handleOpenCollection = () => {
    dispatch(setIsOpeningCollection(true));
  };
  const CreateLink = () => (
    <LinkStyle
      className="underline text-link cursor-pointer"
      theme={theme}
      onClick={onCreateClick}
    >
      {t('COMMON.CREATE', 'Create')}
    </LinkStyle>
  );
  const OpenLink = () => (
    <LinkStyle className="underline text-link cursor-pointer" theme={theme} onClick={() => handleOpenCollection(true)}>
      {t('COMMON.OPEN', 'Open')}
    </LinkStyle>
  );

  return (
    <StyledWrapper className="px-2 mt-4">
      <div className="text-xs text-center">
        <div>{t('SIDEBAR.NO_COLLECTIONS_FOUND', 'No collections found.')}</div>
        <div className="mt-2">
          <Trans
            i18nKey="SIDEBAR.CREATE_OR_OPEN_COLLECTION"
            defaults="<0>Create</0> or <1>Open</1> Collection."
            components={[<CreateLink key="create" />, <OpenLink key="open" />]}
          />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default CreateOrOpenCollection;

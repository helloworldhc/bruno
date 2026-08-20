import React from 'react';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const WSResponseHeaders = ({ response }) => {
  const { t } = useTranslation();
  const formatHeaders = (headers) => {
    if (!headers) return [];
    if (Array.isArray(headers)) return headers;
    return Object.entries(headers).map(([key, value]) => ({ name: key, value }));
  };

  const headersArray = formatHeaders(response.headers);

  return (
    <StyledWrapper className="pb-4 w-full">
      <table>
        <thead>
          <tr>
            <td>{t('COMMON.NAME', 'Name')}</td>
            <td>{t('COMMON.VALUE', 'Value')}</td>
          </tr>
        </thead>
        <tbody>
          {headersArray && headersArray.length ? (
            headersArray.map((header, index) => (
              <tr key={index}>
                <td className="key">{header.name}</td>
                <td className="value">{header.value}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center py-4 text-gray-500">
                {t('WS.NO_HEADERS_RECEIVED', 'No headers received')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StyledWrapper>
  );
};

export default WSResponseHeaders;

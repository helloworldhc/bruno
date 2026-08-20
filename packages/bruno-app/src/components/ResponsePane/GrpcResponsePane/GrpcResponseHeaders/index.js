import React from 'react';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const GrpcResponseHeaders = ({ metadata }) => {
  // Ensure headers is an array
  const metadataArray = Array.isArray(metadata) ? metadata : [];

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
          {metadataArray && metadataArray.length ? (
            metadataArray.map((metadata, index) => (
              <tr key={index}>
                <td className="key">{metadata.name}</td>
                <td className="value">{metadata.value}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center py-4 empty-message">
                No metadata received
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </StyledWrapper>
  );
};

export default GrpcResponseHeaders;

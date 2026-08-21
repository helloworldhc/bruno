import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'providers/Theme';
import GrpcResponseHeaders from './index';

describe('GrpcResponseHeaders', () => {
  it('renders the headers table without throwing', () => {
    render(
      <ThemeProvider>
        <GrpcResponseHeaders metadata={[{ name: 'grpc-status', value: '0' }]} />
      </ThemeProvider>
    );

    expect(screen.getByText('grpc-status')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

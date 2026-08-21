import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'providers/Theme';
import ResponseCopy from './index';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }))
  });
});

const renderCopyButton = () => {
  return render(
    <ThemeProvider>
      <ResponseCopy
        item={{ uid: 'item-1', type: 'http-request' }}
        data='{"ok":true}'
        dataBuffer="eyJvayI6dHJ1ZX0="
        selectedFormat="json"
        selectedTab="editor"
      />
    </ThemeProvider>
  );
};

describe('ResponseCopy', () => {
  it('renders the copy action after a successful response without throwing', () => {
    renderCopyButton();

    expect(screen.getByTestId('response-copy-btn')).toBeInTheDocument();
  });
});

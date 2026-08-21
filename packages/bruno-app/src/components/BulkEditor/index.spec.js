import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'providers/Theme';
import BulkEditor from './index';

jest.mock('components/CodeEditor', () => () => <div data-testid="mock-code-editor" />);

const renderBulkEditor = () => {
  const store = configureStore({
    reducer: {
      app: (state = { preferences: { font: {} } }) => state
    }
  });
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <BulkEditor params={[]} onChange={jest.fn()} onToggle={jest.fn()} />
      </ThemeProvider>
    </Provider>
  );
};

describe('BulkEditor', () => {
  it('renders the key/value edit toggle without throwing', () => {
    renderBulkEditor();

    expect(screen.getByTestId('key-value-edit-toggle')).toBeInTheDocument();
  });
});

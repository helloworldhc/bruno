import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'providers/Theme';
import AppView from './index';

jest.mock('./webview-bridge', () => {
  const actual = jest.requireActual('./webview-bridge');
  return {
    ...actual,
    useAppWebview: () => ({
      domReady: false,
      pushToGuest: jest.fn(),
      webviewRef: { current: null }
    })
  };
});

const item = {
  uid: 'item-1',
  name: 'Get Users',
  type: 'http-request',
  request: {},
  app: { enabled: true, code: '' }
};

const collection = {
  uid: 'coll-1',
  pathname: '/tmp/collection',
  environments: [],
  activeEnvironmentUid: null,
  runtimeVariables: {}
};

const renderAppView = () => {
  const store = configureStore({
    reducer: { app: (state = { preferences: {} }) => state }
  });
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <AppView item={item} collection={collection} code="" />
      </ThemeProvider>
    </Provider>
  );
};

describe('AppView', () => {
  it('renders the app preview toolbar without throwing', () => {
    renderAppView();

    expect(screen.getByTestId('app-view')).toBeInTheDocument();
    expect(screen.getByTestId('app-exit-button')).toBeInTheDocument();
  });
});

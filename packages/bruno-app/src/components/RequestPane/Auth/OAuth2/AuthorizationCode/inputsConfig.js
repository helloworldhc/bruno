const inputsConfig = [
  {
    key: 'authorizationUrl',
    labelKey: 'AUTH.AUTHORIZATION_URL',
    label: 'Authorization URL'
  },
  {
    key: 'accessTokenUrl',
    labelKey: 'AUTH.ACCESS_TOKEN_URL',
    label: 'Access Token URL'
  },
  {
    key: 'clientId',
    labelKey: 'AUTH.CLIENT_ID',
    label: 'Client ID'
  },
  {
    key: 'clientSecret',
    labelKey: 'AUTH.CLIENT_SECRET',
    label: 'Client Secret',
    isSecret: true
  },
  {
    key: 'scope',
    labelKey: 'AUTH.SCOPE',
    label: 'Scope'
  },
  {
    key: 'state',
    labelKey: 'AUTH.STATE',
    label: 'State',
    tooltipKey: 'AUTH.STATE_TOOLTIP',
    tooltip: 'If left empty, Bruno automatically generates a secure random value to help protect against CSRF attacks.'
  }
];

export { inputsConfig };

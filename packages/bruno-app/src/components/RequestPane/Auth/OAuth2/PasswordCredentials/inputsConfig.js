const inputsConfig = [
  {
    key: 'accessTokenUrl',
    labelKey: 'AUTH.ACCESS_TOKEN_URL',
    label: 'Access Token URL'
  },
  {
    key: 'username',
    labelKey: 'AUTH.USERNAME',
    label: 'Username'
  },
  {
    key: 'password',
    labelKey: 'AUTH.PASSWORD',
    label: 'Password',
    isSecret: true
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
  }
];

export { inputsConfig };

module.exports = {
  'parser': 'babel-eslint',
  'extends': [
    'react-tools',
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:react/recommended',
    'plugin:react-redux/recommended',
    'plugin:react-perf/recommended',
    'standard',
    'standard-react',
    'plugin:jsx-a11y/recommended',
    'plugin:css-modules/recommended',
    'plugin:reselect/recommended'
  ],
  'plugins': [
    'babel',
    'import',
    'graphql',
    'jsx-a11y',
    'html',
    'promise',
    'react',
    'react-redux',
    'react-perf',
    'standard',
    'css-modules',
    'xss',
    'no-inferred-method-name',
    'react-functional-set-state',
    'reselect'
  ],
  'env': {
    'browser': true,
    'es6': true
  },
  'globals': {
    '__DEV__': false,
    '__PROD__': false,
    '__PLAYER_DEBUG__': false,
    '__BASENAME__': false
  },
  'settings': {
    'ecmascript': 6,
    'import/resolver': 'webpack'
  },
  'rules': {
    // "graphql/template-strings": ['error', {
    //   // Import default settings for your GraphQL client. Supported values:
    //   // 'apollo', 'relay', 'lokka', 'literal'
    //   env: 'literal',
    //
    //   // Import your schema JSON here
    //   // schemaJson: require('src/graphql/user.gql'),
    //
    //   // OR provide absolute path to your schema JSON
    //   // schemaJsonFilepath: path.resolve(__dirname, './schema.json'),
    //
    //   // OR provide the schema in the Schema Language format
    //   // schemaString: printSchema(schema),
    //
    //   // tagName is gql by default
    // }],

    // 'template-curly-spacing' : 'off',
    // indent : 'off',
    'react-functional-set-state/no-this-state-props': 2,
    'no-void': 2,
    'no-restricted-globals': 2,
    'no-use-before-define': 2,
    'func-names': 1,
    'no-unused-vars': 2,
    'guard-for-in': 2,
    'no-restricted-syntax': 2,

    'jsx-a11y/label-has-for': 'off',
    'no-console': 'off',
    // 'react/no-typos': 'off',
    'max-len': 'off',
    'no-nested-ternary': 'off',
    'camelcase': [
      2,
      {
        'properties': 'never'
      }
    ],
    'react-redux/prefer-separate-component-file': 'off',
    'react/destructuring-assignment': 'off',
    'babel/no-invalid-this': 1,
    'semi': 0,
    'spaced-comment': 0,
    'brace-style': 0,
    'no-trailing-spaces': 0,
    'import/default': 2,
    'import/no-unresolved': [
      2,
      {
        'commonjs': true,
        'amd': true
      }
    ],
    'import/named': 2,
    'import/namespace': 2,
    'import/export': 2,
    'import/no-duplicates': 2,
    'import/imports-first': 2,
    'import/prefer-default-export': 'off'
  },
  'parserOptions': {
    'sourceType': 'module'
  }
}

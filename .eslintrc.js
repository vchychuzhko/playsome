// https://eslint.org/docs/latest/rules
module.exports = {
    root: true,
    env: {
        'browser': true,
        'es6': true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        'ecmaVersion': 'latest',
        'sourceType': 'module',
    },
    rules: {
        'arrow-spacing': 'error',
        'array-bracket-spacing': 'error',
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'comma-dangle': ['error', {
            'arrays': 'always-multiline',
            'objects': 'always-multiline',
            'imports': 'never',
            'exports': 'never',
            'functions': 'never',
        }],
        'comma-spacing': 'error',
        'computed-property-spacing': 'error',
        'func-call-spacing': 'error',
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'key-spacing': ['error', { 'mode': 'minimum' }],
        'keyword-spacing': 'error',
        'multiline-ternary': ['warn', 'always-multiline'],
        'newline-after-var': 'warn',
        'no-console': ['warn', { 'allow': ['warn', 'error'] }],
        'no-trailing-spaces': 'error',
        'object-curly-newline': 'error',
        'object-curly-spacing': ['error', 'always'],
        'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
        'one-var': ['error', 'never'],
        'operator-linebreak': ['error', 'before'],
        'prefer-const': ['warn', { 'destructuring': 'all' }],
        'quotes': ['error', 'single', {
            'avoidEscape': true,
            'allowTemplateLiterals': true,
        }],
        'quote-props': ['warn', 'consistent'],
        'semi': 'error',
        'semi-spacing': 'error',
        'space-before-blocks': 'error',
        'space-before-function-paren': 'error',
        'space-in-parens': 'error',
        'space-infix-ops': 'error',
        'space-unary-ops': ['error', {
            'words': true,
            'nonwords': false,
        }],
        'spaced-comment': 'warn',
    },
};

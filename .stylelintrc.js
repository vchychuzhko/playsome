// https://stylelint.io/user-guide/rules/list
module.exports = {
    extends: 'stylelint-config-standard',
    overrides: [{
        'files': ['**/*.scss'],
        'customSyntax': 'postcss-scss',
    }],
    rules: {
        'at-rule-empty-line-before': ['always', { 'ignore': ['blockless-after-blockless'] }],
        'color-hex-length': 'long',
        'declaration-empty-line-before': ['never', { 'ignore': ['after-declaration'] }],
        'indentation': 4,
        'no-invalid-position-at-import-rule': null,
        'property-no-vendor-prefix': [true, {
            'ignoreProperties': ['appearance'],
            'severity': 'warning',
        }],
        'selector-list-comma-newline-before': 'never-multi-line',
        'selector-list-comma-newline-after': 'always-multi-line',
        'selector-list-comma-space-before': 'never-single-line',
        'selector-list-comma-space-after': 'always-single-line',
    },
};

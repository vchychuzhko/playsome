import translations from './translations';

export default {
    _lang: null,
    _getLanguage () {
        if (this._lang) return this._lang;

        this._lang = document.documentElement.getAttribute('lang');

        return this._lang;
    },
    t (text) {
        const lang = this._getLanguage();

        return translations[lang][text] || text;
    }
};

import { translations } from './translations';

export const i18n = {
    t (text) {
        const lang = document.documentElement.lang;

        return translations[lang]?.[text] || text;
    },
};

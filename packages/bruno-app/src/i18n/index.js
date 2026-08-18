import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEn from './translation/en.json';
import translationZhCN from './translation/zh-CN.json';

const resources = {
  'en': {
    translation: translationEn
  },
  'zh-CN': {
    translation: translationZhCN
  },
  'zh': {
    translation: translationZhCN
  }
};

export const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedLang = window.localStorage.getItem('bruno.language');
    if (savedLang && savedLang !== 'system') {
      return savedLang;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('zh')) {
      return 'zh-CN';
    }
  }
  return 'en';
};

export const changeAppLanguage = (lang) => {
  if (!lang || lang === 'system') {
    const systemLang = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('bruno.language', 'system');
    }
    return i18n.changeLanguage(systemLang);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('bruno.language', lang);
  }
  return i18n.changeLanguage(lang);
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    ns: 'translation',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;

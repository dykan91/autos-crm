import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './ru';
import de from './de';

const saved = localStorage.getItem('lang');
const defaultLang = (saved === 'ru' || saved === 'de') ? saved : 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      de: { translation: de },
    },
    lng: defaultLang,
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang: 'ru' | 'de') {
  localStorage.setItem('lang', lang);
  void i18n.changeLanguage(lang);
}

export default i18n;
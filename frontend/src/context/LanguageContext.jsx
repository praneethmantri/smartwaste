import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { t } = useTranslation();
  const [lang, setLangState] = useState(() => localStorage.getItem('smartwaste_lang') || i18n.language || 'en');

  const setLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    setLangState(newLang);
    try {
      localStorage.setItem('smartwaste_lang', newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLangState(lng);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChanged);
    document.documentElement.lang = lang;

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, i18n }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

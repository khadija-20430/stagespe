import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr/translation.json";
import en from "./locales/en/translation.json";
import ar from "./locales/ar/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });

// ============================================================
// GESTION GLOBALE DU SENS D'ÉCRITURE (RTL / LTR)
// Cette logique s'applique automatiquement peu importe où la
// langue est changée : navbar visiteur, sidebar admin, etc.
// ============================================================
const RTL_LANGUAGES = ["ar"];

function applyDirection(lng) {
  const dir = RTL_LANGUAGES.includes(lng) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

// Applique dès le chargement initial (utile si l'utilisateur revient
// sur le site avec l'arabe déjà enregistré par le LanguageDetector)
applyDirection(i18n.language);

// Applique à CHAQUE changement de langue, où qu'il soit déclenché
i18n.on("languageChanged", applyDirection);

export default i18n;
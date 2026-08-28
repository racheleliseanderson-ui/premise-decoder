/**
 * Interface language. Chrome, mode names, and the standing disclaimers are
 * translated; anything the reader typed, pasted, or that the desk quotes back
 * stays in the language it arrived in — a quote is evidence, not copy.
 *
 * Publication and app names (Vanity or Vice, Spa Intelligence, Northern
 * Lantern House Labs, every fleet entry) stay in English in every language.
 */

import { useCallback, useEffect, useState } from "react";

export type Lang = "en" | "es" | "fr";

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "es", label: "Español", short: "ES" },
  { id: "fr", label: "Français", short: "FR" },
];

const KEY = "spa-intel-lang";

type Dict = Record<string, string>;

const en: Dict = {
  "mode.fast": "Four questions",
  "mode.intake": "Add venue text",
  "mode.full": "Full evaluate",
  "mode.compare": "Compare venues",
  "mode.prep": "Consult prep",
  "mode.decode": "Claim decoder",
  "mode.library": "Reference library",
  "mode.packet": "Decision card",
  "chip.failClosed": "unnamed",
  "chip.clear": "Desk clear",
  "chip.venues": "venues",
  "hdr.start": "Start evaluate",
  "hdr.kicker": "Vanity or Vice Desk",
  "theme.day": "Pearl",
  "theme.night": "Dark",
  "theme.cvd": "CVD",
  "theme.label": "Display mode",
  "run.title": "Check steps",
  "run.all": "Run every stage",
  "run.stage": "Run stage",
  "run.reset": "Reset run log",
  "lang.label": "Interface language",
  "edu.only": "Education only · no diagnosis · no ranking · no candidacy",
  "foot.house": "The House",
  "foot.houseLine": "Independent publications and the decision guides built for them.",
  "foot.pub": "This publication",
  "foot.fleet": "Across the fleet",
  "foot.legal": "Legal & Accessibility",
  "foot.support": "Support",
  "foot.rights": "© 2026 Northern Lantern House",
  "nav.label": "App panels",
  "nav.menu": "Menu",
  "nav.close": "Close",
  "nav.skip": "Skip to desk",
};

const es: Dict = {
  "mode.fast": "Cuatro preguntas",
  "mode.intake": "Añadir texto del local",
  "mode.full": "Evaluación completa",
  "mode.compare": "Comparar locales",
  "mode.prep": "Preparar consulta",
  "mode.decode": "Descifrar promesas",
  "mode.library": "Biblioteca de referencia",
  "mode.packet": "Ficha de decisión",
  "chip.failClosed": "sin nombre",
  "chip.clear": "Mesa despejada",
  "chip.venues": "locales",
  "hdr.start": "Empezar evaluación",
  "hdr.kicker": "Mesa Vanity or Vice",
  "theme.day": "Perla",
  "theme.night": "Oscuro",
  "theme.cvd": "DCV",
  "theme.label": "Modo de visualización",
  "run.title": "Proceso",
  "run.all": "Ejecutar todas las etapas",
  "run.stage": "Ejecutar etapa",
  "run.reset": "Reiniciar registro",
  "lang.label": "Idioma de la interfaz",
  "edu.only": "Solo educativo · sin diagnóstico · sin clasificación · sin idoneidad",
  "foot.house": "La Casa",
  "foot.houseLine":
    "Publicaciones independientes y las guías de decisión creadas para ellas.",
  "foot.pub": "Esta publicación",
  "foot.fleet": "En toda la flota",
  "foot.legal": "Aviso legal y accesibilidad",
  "foot.support": "Soporte",
  "foot.rights": "© 2026 Northern Lantern House",
  "nav.label": "Paneles de la aplicación",
  "nav.menu": "Menú",
  "nav.close": "Cerrar",
  "nav.skip": "Ir al escritorio",
};

const fr: Dict = {
  "mode.fast": "Quatre questions",
  "mode.intake": "Ajouter le texte du lieu",
  "mode.full": "Évaluation complète",
  "mode.compare": "Comparer les lieux",
  "mode.prep": "Préparer la consultation",
  "mode.decode": "Décoder les promesses",
  "mode.library": "Bibliothèque de référence",
  "mode.packet": "Fiche de décision",
  "chip.failClosed": "sans nom",
  "chip.clear": "Bureau dégagé",
  "chip.venues": "lieux",
  "hdr.start": "Commencer l'évaluation",
  "hdr.kicker": "Bureau Vanity or Vice",
  "theme.day": "Perle",
  "theme.night": "Sombre",
  "theme.cvd": "DCV",
  "theme.label": "Mode d'affichage",
  "run.title": "Chaîne",
  "run.all": "Exécuter toutes les étapes",
  "run.stage": "Exécuter l'étape",
  "run.reset": "Réinitialiser le journal",
  "lang.label": "Langue de l'interface",
  "edu.only": "À titre éducatif · aucun diagnostic · aucun classement · aucune éligibilité",
  "foot.house": "La Maison",
  "foot.houseLine":
    "Des publications indépendantes et les guides de décision conçus pour elles.",
  "foot.pub": "Cette publication",
  "foot.fleet": "Dans toute la flotte",
  "foot.legal": "Mentions légales et accessibilité",
  "foot.support": "Assistance",
  "foot.rights": "© 2026 Northern Lantern House",
  "nav.label": "Panneaux de l'application",
  "nav.menu": "Menu",
  "nav.close": "Fermer",
  "nav.skip": "Aller au bureau",
};

const DICTS: Record<Lang, Dict> = { en, es, fr };

export function useLang() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "es" || stored === "fr" || stored === "en") setLang(stored);
    } catch {
      /* storage blocked — English stands */
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const choose = useCallback((next: Lang) => {
    setLang(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: string) => DICTS[lang][key] ?? en[key] ?? key, [lang]);

  return { lang, setLang: choose, t };
}

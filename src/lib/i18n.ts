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
<<<<<<< Updated upstream
  "mode.full": "Check this venue",
=======
  "mode.full": "Check the setting",
>>>>>>> Stashed changes
  "mode.compare": "Compare venues",
  "mode.prep": "Consult prep",
  "mode.decode": "Claim decoder",
  "mode.library": "Reference library",
<<<<<<< Updated upstream
  "mode.packet": "Decision card",
  "chip.failClosed": "unnamed",
  "chip.clear": "Desk clear",
=======
  "mode.packet": "Before you book",
  "chip.failClosed": "not stated",
  "chip.clear": "Nothing on the desk",
>>>>>>> Stashed changes
  "chip.venues": "venues",
  "hdr.start": "Start checking",
  "hdr.kicker": "Vanity or Vice Desk",
  "theme.day": "Pearl",
  "theme.night": "Dark",
  "theme.cvd": "CVD",
  "theme.label": "Display mode",
<<<<<<< Updated upstream
  "run.title": "Check steps",
  "run.all": "Check every stage",
  "run.stage": "Check this stage",
  "run.reset": "Clear the check log",
  "lang.label": "Interface language",
  "edu.only": "Education only · no diagnosis · no ranking · no candidacy",
  "foot.house": "The House",
  "foot.houseLine": "Independent publications and the decision guides built for them.",
=======
  "run.title": "Where you stand",
  "run.all": "Read every step",
  "run.stage": "Read this step",
  "run.reset": "Start over",
  "lang.label": "Interface language",
  "edu.only": "Education only · no diagnosis · no ranking · no candidacy",
  "foot.house": "The House",
  "foot.houseLine": "Independent publications and the decision tools built for them.",
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  "mode.full": "Revisar este local",
=======
  "mode.full": "Revisar el local",
>>>>>>> Stashed changes
  "mode.compare": "Comparar locales",
  "mode.prep": "Preparar consulta",
  "mode.decode": "Descifrar promesas",
  "mode.library": "Biblioteca de referencia",
<<<<<<< Updated upstream
  "mode.packet": "Ficha de decisión",
  "chip.failClosed": "sin nombre",
  "chip.clear": "Mesa despejada",
=======
  "mode.packet": "Antes de reservar",
  "chip.failClosed": "sin indicar",
  "chip.clear": "No hay nada en la mesa",
>>>>>>> Stashed changes
  "chip.venues": "locales",
  "hdr.start": "Empezar la revisión",
  "hdr.kicker": "Mesa Vanity or Vice",
  "theme.day": "Perla",
  "theme.night": "Oscuro",
  "theme.cvd": "DCV",
  "theme.label": "Modo de visualización",
<<<<<<< Updated upstream
  "run.title": "Pasos a revisar",
  "run.all": "Revisar todas las etapas",
  "run.stage": "Revisar esta etapa",
  "run.reset": "Borrar el registro",
=======
  "run.title": "Cómo va",
  "run.all": "Leer todos los pasos",
  "run.stage": "Leer este paso",
  "run.reset": "Empezar de nuevo",
>>>>>>> Stashed changes
  "lang.label": "Idioma de la interfaz",
  "edu.only": "Solo educativo · sin diagnóstico · sin clasificación · sin idoneidad",
  "foot.house": "La Casa",
  "foot.houseLine":
<<<<<<< Updated upstream
    "Publicaciones independientes y las guías de decisión creadas para ellas.",
=======
    "Publicaciones independientes y las herramientas de decisión creadas para ellas.",
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  "mode.full": "Vérifier ce lieu",
=======
  "mode.full": "Examiner le lieu",
>>>>>>> Stashed changes
  "mode.compare": "Comparer les lieux",
  "mode.prep": "Préparer la consultation",
  "mode.decode": "Décoder les promesses",
  "mode.library": "Bibliothèque de référence",
<<<<<<< Updated upstream
  "mode.packet": "Fiche de décision",
  "chip.failClosed": "sans nom",
  "chip.clear": "Bureau dégagé",
=======
  "mode.packet": "Avant de réserver",
  "chip.failClosed": "non précisé",
  "chip.clear": "Rien sur le bureau",
>>>>>>> Stashed changes
  "chip.venues": "lieux",
  "hdr.start": "Commencer l'examen",
  "hdr.kicker": "Bureau Vanity or Vice",
  "theme.day": "Perle",
  "theme.night": "Sombre",
  "theme.cvd": "DCV",
  "theme.label": "Mode d'affichage",
<<<<<<< Updated upstream
  "run.title": "Étapes à vérifier",
  "run.all": "Vérifier toutes les étapes",
  "run.stage": "Vérifier cette étape",
  "run.reset": "Effacer le journal",
  "lang.label": "Langue de l'interface",
  "edu.only": "À titre éducatif · aucun diagnostic · aucun classement · aucune éligibilité",
  "foot.house": "La Maison",
  "foot.houseLine":
    "Des publications indépendantes et les guides de décision conçus pour elles.",
=======
  "run.title": "Où vous en êtes",
  "run.all": "Lire toutes les étapes",
  "run.stage": "Lire cette étape",
  "run.reset": "Recommencer",
  "lang.label": "Langue de l'interface",
  "edu.only": "À titre éducatif · aucun diagnostic · aucun classement · aucune éligibilité",
  "foot.house": "La Maison",
  "foot.houseLine": "Des publications indépendantes et les outils de décision conçus pour elles.",
>>>>>>> Stashed changes
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

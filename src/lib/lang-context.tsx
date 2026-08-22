import { createContext, useContext, type ReactNode } from "react";
import { useLang, type Lang } from "./i18n";

type LangValue = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };

const Ctx = createContext<LangValue | null>(null);

/** One interface language for the whole shell — house bar and Labs footer agree. */
export function LangProvider({ children }: { children: ReactNode }) {
  const value = useLang();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInterfaceLang(): LangValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInterfaceLang must be used inside LangProvider");
  return v;
}

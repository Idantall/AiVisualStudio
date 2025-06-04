import { createContext, useContext, useEffect, useState } from "react"

export type Language = "he" | "en"

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
}

type LanguageProviderState = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const initialState: LanguageProviderState = {
  language: "he",
  setLanguage: () => null,
  t: () => "",
}

const LanguageProviderContext = createContext<LanguageProviderState>(initialState)

import { translations } from "@/lib/translations"

export function LanguageProvider({
  children,
  defaultLanguage = "he",
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("ai-studio-language") as Language) || defaultLanguage
  )

  useEffect(() => {
    const root = window.document.documentElement
    
    root.setAttribute("lang", language)
    root.setAttribute("dir", language === "he" ? "rtl" : "ltr")
    document.title = language === "he" 
      ? "AI Video Studio - סטודיו וידאו בינה מלאכותית"
      : "AI Video Studio - Artificial Intelligence Video Studio"
  }, [language])

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  const value = {
    language,
    setLanguage: (language: Language) => {
      localStorage.setItem("ai-studio-language", language)
      setLanguage(language)
    },
    t,
  }

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext)

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider")

  return context
}

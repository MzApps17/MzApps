"use client";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  language: string;
  setLanguage: (v: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  fontSize: 16,
  setFontSize: () => {},
  language: "en",
  setLanguage: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const d = localStorage.getItem("mz-dark");
    const f = localStorage.getItem("mz-font");
    const l = localStorage.getItem("mz-lang");
    if (d) setDarkMode(d === "true");
    if (f) setFontSize(Number(f));
    if (l) setLanguage(l);
  }, []);

  useEffect(() => {
    localStorage.setItem("mz-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("mz-font", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("mz-lang", language);
  }, [language]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, fontSize, setFontSize, language, setLanguage }}>
      <div style={{
        background: darkMode? "#0a0a0a" : "#ffffff",
        color: darkMode? "#ffffff" : "#000000",
        fontSize: fontSize + "px",
        minHeight: "100vh",
        transition: "all 0.2s ease"
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

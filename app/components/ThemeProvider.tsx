"use client";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  theme: string;
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  fontSize: 16,
  setFontSize: () => {},
  theme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const d = localStorage.getItem("mz-dark");
    const f = localStorage.getItem("mz-font");
    if (d) setDarkMode(d === "true");
    if (f) setFontSize(Number(f));
  }, []);

  useEffect(() => { localStorage.setItem("mz-dark", String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem("mz-font", String(fontSize)); }, [fontSize]);

  // Auto scale - 16 = 100%
  const scale = fontSize / 16;

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, fontSize, setFontSize, theme: darkMode? "dark" : "light" }}>
      <div style={{
        background: darkMode? "#0a0a0a" : "#ffffff",
        color: darkMode? "#ffffff" : "#000000",
        minHeight: "100vh",
        width: "100%",
        // HEI HI A MAGIC - hardcore font pawh a scale vek!
        zoom: scale as any,
      }}>
        {/* Backup for Firefox - zoom work loh na tan */}
        <style>{`
          @supports not (zoom: 1) {
            div[data-mz-root] {
              transform: scale(${scale});
              transform-origin: top left;
              width: ${100/scale}%;
              height: ${100/scale}%;
            }
          }
        `}</style>
        <div data-mz-root>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;

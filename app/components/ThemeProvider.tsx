"use client";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  theme?: string; // footer hlui tan compatibility
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

  const theme = darkMode? "dark" : "light";

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, fontSize, setFontSize, theme }}>
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
export default ThemeProvider;

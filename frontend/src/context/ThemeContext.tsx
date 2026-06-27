import { createContext, useContext, useState, useEffect, ReactNode } from "react";

//////////////////////////////////////////////////////
// 🎨 THEME CONTEXT
//////////////////////////////////////////////////////

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState(() => {
    return localStorage.getItem("themeColor") || "#4f46e5";
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const setPrimaryColor = (color: string) => {
    localStorage.setItem("themeColor", color);
    setPrimaryColorState(color);
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    localStorage.setItem("darkMode", String(newVal));
    setDarkMode(newVal);
  };

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeContext must be used within ThemeProvider");
  return context;
}

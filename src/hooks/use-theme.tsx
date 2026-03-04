import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";

    // If View Transitions API is available, use circular clip-path reveal
    if (document.startViewTransition && e) {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty("--reveal-x", `${x}px`);
      document.documentElement.style.setProperty("--reveal-y", `${y}px`);

      document.startViewTransition(() => {
        setTheme(newTheme);
        // Apply immediately so the new "snapshot" has the right theme
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
        localStorage.setItem("theme", newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

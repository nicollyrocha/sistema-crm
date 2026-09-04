"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

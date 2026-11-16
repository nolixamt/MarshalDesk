"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

const themedPrefixes = ["/dashboard"];

function isThemedPath(pathname: string): boolean {
  return themedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Only the app surfaces follow the owner's theme. Marketing and auth are
// styled for the light token set (auth adds its own `dark` wrapper), so a
// stored "dark" choice must not leak a `.dark` class onto them.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  return (
    <NextThemesProvider
      {...props}
      forcedTheme={isThemedPath(pathname) ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}

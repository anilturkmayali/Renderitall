export const AVAILABLE_FONTS = [
  { name: "", label: "System Default", type: "system" as const },
  { name: "Segoe UI", label: "Segoe UI", type: "system" as const },
  { name: "Aptos", label: "Aptos", type: "system" as const },
  { name: "Inter", label: "Inter", type: "google" as const },
  { name: "Roboto", label: "Roboto", type: "google" as const },
  { name: "Open Sans", label: "Open Sans", type: "google" as const },
  { name: "Lato", label: "Lato", type: "google" as const },
  { name: "Poppins", label: "Poppins", type: "google" as const },
  { name: "Nunito", label: "Nunito", type: "google" as const },
  { name: "Raleway", label: "Raleway", type: "google" as const },
  { name: "DM Sans", label: "DM Sans", type: "google" as const },
  { name: "IBM Plex Sans", label: "IBM Plex Sans", type: "google" as const },
  { name: "Source Sans 3", label: "Source Sans 3", type: "google" as const },
  { name: "Merriweather", label: "Merriweather", type: "google" as const },
  { name: "Noto Sans", label: "Noto Sans", type: "google" as const },
  { name: "Work Sans", label: "Work Sans", type: "google" as const },
  { name: "Fira Sans", label: "Fira Sans", type: "google" as const },
  { name: "Manrope", label: "Manrope", type: "google" as const },
  { name: "Plus Jakarta Sans", label: "Plus Jakarta Sans", type: "google" as const },
  { name: "Outfit", label: "Outfit", type: "google" as const },
  { name: "Lexend", label: "Lexend", type: "google" as const },
];

export function getFontFamily(fontName: string): string {
  if (!fontName) return "inherit";
  const font = AVAILABLE_FONTS.find((f) => f.name === fontName);
  if (font?.type === "system") return `"${fontName}", -apple-system, BlinkMacSystemFont, sans-serif`;
  return `"${fontName}", sans-serif`;
}

export function getGoogleFontUrl(fontName: string): string | null {
  if (!fontName) return null;
  const font = AVAILABLE_FONTS.find((f) => f.name === fontName);
  if (font?.type !== "google") return null;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700&display=swap`;
}

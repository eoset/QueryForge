/**
 * Theme Colors Utility
 * Maps Monaco theme colors to CSS variables for app-wide theming
 */

import type { ThemeDefinition, MonacoThemeColors } from '../../shared/types/theme';

/**
 * Adjust color brightness
 * @param hex - Hex color (with or without #)
 * @param percent - Positive = lighter, negative = darker
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Parse RGB
  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
  
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Add alpha to a hex color
 */
function addAlpha(hex: string, alpha: number): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Determine if a color is dark
 */
function isDarkColor(hex: string): boolean {
  const color = hex.replace('#', '');
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Map Monaco theme colors to CSS variables
 */
function mapThemeColorsToCSSVariables(
  colors: MonacoThemeColors,
  isDark: boolean
): Record<string, string> {
  const editorBg = colors['editor.background'] || (isDark ? '#1e1e1e' : '#ffffff');
  const editorFg = colors['editor.foreground'] || (isDark ? '#cccccc' : '#333333');
  const selectionBg = colors['editor.selectionBackground'] || (isDark ? '#264f78' : '#add6ff');
  const lineHighlight = colors['editor.lineHighlightBackground'] || adjustBrightness(editorBg, isDark ? 5 : -5);
  
  // Derive secondary and tertiary backgrounds
  const bgSecondary = adjustBrightness(editorBg, isDark ? 3 : -3);
  const bgTertiary = adjustBrightness(editorBg, isDark ? 6 : -6);
  const bgInput = adjustBrightness(editorBg, isDark ? 10 : 0);
  const bgHover = adjustBrightness(editorBg, isDark ? 5 : -5);
  
  // Derive text colors
  const textSecondary = adjustBrightness(editorFg, isDark ? -30 : 30);
  
  // Border colors
  const borderPrimary = adjustBrightness(editorBg, isDark ? 15 : -15);
  
  // Scrollbar colors
  const scrollbarThumb = adjustBrightness(editorBg, isDark ? 20 : -20);
  const scrollbarThumbHover = adjustBrightness(editorBg, isDark ? 25 : -25);
  const scrollbarThumbActive = adjustBrightness(editorBg, isDark ? 30 : -30);
  
  // Button secondary
  const buttonSecondary = borderPrimary;
  const buttonSecondaryHover = adjustBrightness(borderPrimary, isDark ? 5 : -5);
  
  // Shadows (darker for dark themes, lighter for light themes)
  const shadowAlpha = isDark ? 0.4 : 0.15;
  
  // Badge colors derived from editor foreground
  const badgeAlpha = isDark ? 0.15 : 0.1;
  
  return {
    '--bg-primary': editorBg,
    '--bg-secondary': bgSecondary,
    '--bg-tertiary': bgTertiary,
    '--bg-input': bgInput,
    '--bg-hover': bgHover,
    '--bg-scrollbar': editorBg,
    '--bg-scrollbar-thumb': scrollbarThumb,
    '--bg-scrollbar-thumb-hover': scrollbarThumbHover,
    '--bg-scrollbar-thumb-active': scrollbarThumbActive,
    '--bg-overlay': addAlpha('#000000', isDark ? 0.7 : 0.4),
    
    '--border-primary': borderPrimary,
    
    '--text-primary': editorFg,
    '--text-secondary': textSecondary,
    
    '--button-secondary': buttonSecondary,
    '--button-secondary-hover': buttonSecondaryHover,
    
    '--shadow-dialog': `0 8px 16px rgba(0, 0, 0, ${shadowAlpha})`,
    '--shadow-dropdown': `0 2px 8px rgba(0, 0, 0, ${shadowAlpha * 0.75})`,
    '--shadow-modal': `0 4px 20px rgba(0, 0, 0, ${shadowAlpha * 1.25})`,
    '--shadow-tooltip': `0 4px 12px rgba(0, 0, 0, ${shadowAlpha})`,
  };
}

/**
 * Apply theme colors to the document root as CSS variables
 */
export function applyThemeColors(theme: ThemeDefinition): void {
  const root = document.documentElement;
  const isDark = theme.type === 'dark';
  
  // If theme has editor colors, map them to CSS variables
  if (theme.editor?.colors) {
    const cssVars = mapThemeColorsToCSSVariables(theme.editor.colors, isDark);
    
    for (const [property, value] of Object.entries(cssVars)) {
      root.style.setProperty(property, value);
    }
  } else {
    // Clear custom CSS variables and let data-theme handle it
    clearThemeColors();
  }
  
  // Apply any custom app colors if provided
  if (theme.app) {
    const appColorMap: Record<string, string> = {
      bgPrimary: '--bg-primary',
      bgSecondary: '--bg-secondary',
      bgTertiary: '--bg-tertiary',
      bgInput: '--bg-input',
      bgHover: '--bg-hover',
      textPrimary: '--text-primary',
      textSecondary: '--text-secondary',
      accentPrimary: '--accent-primary',
    };
    
    for (const [key, cssVar] of Object.entries(appColorMap)) {
      const value = theme.app[key as keyof typeof theme.app];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    }
  }
}

/**
 * Clear all custom theme CSS variables (reset to stylesheet defaults)
 */
export function clearThemeColors(): void {
  const root = document.documentElement;
  const properties = [
    '--bg-primary',
    '--bg-secondary',
    '--bg-tertiary',
    '--bg-input',
    '--bg-hover',
    '--bg-scrollbar',
    '--bg-scrollbar-thumb',
    '--bg-scrollbar-thumb-hover',
    '--bg-scrollbar-thumb-active',
    '--bg-overlay',
    '--border-primary',
    '--text-primary',
    '--text-secondary',
    '--button-secondary',
    '--button-secondary-hover',
    '--shadow-dialog',
    '--shadow-dropdown',
    '--shadow-modal',
    '--shadow-tooltip',
  ];
  
  for (const property of properties) {
    root.style.removeProperty(property);
  }
}


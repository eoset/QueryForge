/**
 * Theme type definitions for QueryForge
 * Supports Monaco Editor themes and app-level CSS customization
 */

// Monaco Editor theme rule for token colorization
export interface MonacoThemeRule {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

// Monaco Editor color settings
// Note: Monaco IColors expects non-optional strings, but theme files may have optional values
export interface MonacoThemeColors {
  [key: string]: string;
}

// Monaco theme base types
export type MonacoThemeBase = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

// Complete Monaco theme data structure
export interface MonacoThemeData {
  base: MonacoThemeBase;
  inherit: boolean;
  rules: MonacoThemeRule[];
  colors: MonacoThemeColors;
}

// App theme type (dark or light)
export type AppThemeType = 'dark' | 'light';

// App-level theme colors (CSS variables)
export interface AppThemeColors {
  bgPrimary?: string;
  bgSecondary?: string;
  bgTertiary?: string;
  bgInput?: string;
  bgHover?: string;
  textPrimary?: string;
  textSecondary?: string;
  accentPrimary?: string;
  // Additional CSS variables can be added as needed
}

// Complete theme definition
export interface ThemeDefinition {
  id: string;
  name: string;
  type: AppThemeType;
  isBuiltIn: boolean;
  isDefault: boolean;
  editor?: MonacoThemeData;  // Monaco-specific settings (optional for built-in themes)
  app?: AppThemeColors;      // App CSS variable overrides (optional)
}

// Theme settings stored in electron-store
export interface StoredThemeSettings {
  activeThemeId: string;
  customThemes: ThemeDefinition[];
}

// Theme file format (what users import)
export interface ThemeFileFormat {
  name: string;
  base: MonacoThemeBase;
  inherit?: boolean;
  rules?: MonacoThemeRule[];
  colors?: MonacoThemeColors;
  app?: AppThemeColors;
}


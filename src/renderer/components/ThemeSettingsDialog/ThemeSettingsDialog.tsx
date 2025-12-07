import React, { useRef, useState } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import './ThemeSettingsDialog.css';

interface ThemeSettingsDialogProps {
  onClose: () => void;
}

// IDs of popular themes to show at the top of the additional themes section
const POPULAR_THEME_IDS = [
  'monokai', 'monokai-bright', 'night-owl', 'oceanic-next', 'github',
  'solarized-dark', 'solarized-light', 'tomorrow', 'tomorrow-night',
  'tomorrow-night-blue', 'tomorrow-night-bright', 'tomorrow-night-eighties',
  'cobalt', 'twilight'
];

// IDs of core Monaco themes (not from monaco-themes package)
const CORE_THEME_IDS = ['monaco-vs', 'monaco-vs-dark', 'monaco-hc-black', 'monaco-hc-light'];

export const ThemeSettingsDialog: React.FC<ThemeSettingsDialogProps> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const {
    allThemes,
    activeTheme,
    setActiveTheme,
    importTheme,
    deleteCustomTheme,
  } = useThemeStore();

  const handleThemeSelect = async (themeId: string) => {
    setError(null);
    await setActiveTheme(themeId);
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      setError(null);
      try {
        await importTheme(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import theme');
      } finally {
        setImporting(false);
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    await deleteCustomTheme(themeId);
  };

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Group themes by category
  const defaultThemes = allThemes.filter(t => t.isDefault);
  const coreThemes = allThemes.filter(t => CORE_THEME_IDS.includes(t.id));
  const popularThemes = allThemes.filter(t => POPULAR_THEME_IDS.includes(t.id));
  const otherBuiltInThemes = allThemes.filter(t => 
    t.isBuiltIn && 
    !t.isDefault && 
    !CORE_THEME_IDS.includes(t.id) && 
    !POPULAR_THEME_IDS.includes(t.id)
  );
  const customThemes = allThemes.filter(t => !t.isBuiltIn);

  const renderThemeItem = (theme: typeof allThemes[0], canDelete = false) => (
    <div
      key={theme.id}
      className={`theme-item ${activeTheme.id === theme.id ? 'active' : ''}`}
      onClick={() => handleThemeSelect(theme.id)}
    >
      <span className="theme-name">{theme.name}</span>
      <span className={`theme-badge ${theme.type}`}>{theme.type}</span>
      {canDelete && (
        <button
          className="theme-delete-btn"
          onClick={(e) => handleDelete(theme.id, e)}
          title="Delete theme"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className="theme-dialog-overlay" onClick={onClose}>
      <div className="theme-dialog" onClick={handleDialogClick}>
        <h2>Theme Settings</h2>

        <div className="theme-content">
          {/* Error message */}
          {error && (
            <div className="theme-error">
              {error}
            </div>
          )}

          {/* Default Themes */}
          <div className="theme-section">
            <h3>Default Themes</h3>
            <div className="theme-list">
              {defaultThemes.map(theme => renderThemeItem(theme))}
            </div>
          </div>

          {/* Core Monaco Themes */}
          <div className="theme-section">
            <h3>Monaco Core</h3>
            <div className="theme-list">
              {coreThemes.map(theme => renderThemeItem(theme))}
            </div>
          </div>

          {/* Popular Themes */}
          <div className="theme-section">
            <h3>Popular Themes</h3>
            <div className="theme-list theme-list-scrollable">
              {popularThemes.map(theme => renderThemeItem(theme))}
            </div>
          </div>

          {/* Other Built-in Themes */}
          <div className="theme-section">
            <h3>More Themes ({otherBuiltInThemes.length})</h3>
            <div className="theme-list theme-list-scrollable">
              {otherBuiltInThemes.map(theme => renderThemeItem(theme))}
            </div>
          </div>

          {/* Custom Themes */}
          <div className="theme-section">
            <h3>Custom Themes</h3>
            {customThemes.length > 0 ? (
              <div className="theme-list">
                {customThemes.map(theme => renderThemeItem(theme, true))}
              </div>
            ) : (
              <p className="no-custom-themes">No custom themes imported yet.</p>
            )}

            <button
              className="import-theme-btn"
              onClick={handleImportClick}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import Theme File...'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="theme-hint">
              Import additional Monaco-compatible theme JSON files.
            </p>
          </div>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

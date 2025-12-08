import React, { useEffect } from 'react';
import './HelpDialog.css';

interface HelpDialogProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: Shortcut[] = [
    // Help
    { keys: `${modifierKey} + ?`, description: 'Show keyboard shortcuts', category: 'Help' },
    
    // File
    { keys: `${modifierKey} + T`, description: 'New Tab', category: 'File' },
    { keys: `${modifierKey} + S`, description: 'Save Query', category: 'File' },
    { keys: isMac ? '⌘ + Q' : 'Ctrl + Q', description: 'Quit Application', category: 'File' },
    
    // Tab Navigation
    { keys: `${modifierKey} + 1-9`, description: 'Switch to tab by number (1-9)', category: 'Tab Navigation' },
    
    // Query Editor
    { keys: `${modifierKey} + Enter`, description: 'Execute query', category: 'Query Editor' },
    { keys: `${modifierKey} + B`, description: 'Expand SELECT * to column list', category: 'Query Editor' },
    { keys: `${modifierKey} + P`, description: 'Search Schema', category: 'Query Editor' },
    
    // Edit
    { keys: `${modifierKey} + Z`, description: 'Undo', category: 'Edit' },
    { keys: `${modifierKey} + Shift + Z`, description: 'Redo', category: 'Edit' },
    { keys: `${modifierKey} + X`, description: 'Cut', category: 'Edit' },
    { keys: `${modifierKey} + C`, description: 'Copy', category: 'Edit' },
    { keys: `${modifierKey} + V`, description: 'Paste', category: 'Edit' },
    
    // View
    { keys: `${modifierKey} + =`, description: 'Zoom In', category: 'View' },
    { keys: `${modifierKey} + -`, description: 'Zoom Out', category: 'View' },
    { keys: `${modifierKey} + 0`, description: 'Reset Zoom', category: 'View' },
    { keys: `${modifierKey} + F11`, description: 'Toggle Full Screen', category: 'View' },
    { keys: `${modifierKey} + Shift + T`, description: 'Theme Settings', category: 'View' },
    { keys: `${modifierKey} + Shift + I`, description: 'Toggle AI Assistant', category: 'View' },
  ];

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent closing when clicking inside the dialog
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="help-dialog-overlay" onClick={onClose}>
      <div className="help-dialog" onClick={handleDialogClick}>
        <h2>Keyboard Shortcuts</h2>
        <div className="help-content">
          {categories.map((category) => (
            <div key={category} className="shortcut-category">
              <h3>{category}</h3>
              <div className="shortcut-list">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-keys">
                        {shortcut.keys.split(' + ').map((key, i) => (
                          <React.Fragment key={i}>
                            <kbd>{key}</kbd>
                            {i < shortcut.keys.split(' + ').length - 1 && <span> + </span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};


import React, { useEffect } from 'react';
import './QueryEditor.css';

interface SaveQueryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saveName: string;
  onNameChange: (name: string) => void;
  saveDescription: string;
  onDescriptionChange: (description: string) => void;
  isUpdate: boolean;
  isSaveDisabled: boolean;
}

export const SaveQueryDialog: React.FC<SaveQueryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  saveName,
  onNameChange,
  saveDescription,
  onDescriptionChange,
  isUpdate,
  isSaveDisabled,
}) => {
  // Handle ESC key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !isSaveDisabled) {
        e.preventDefault();
        onSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSave, isSaveDisabled]);

  if (!isOpen) return null;

  return (
    <div className="save-dialog-overlay" onClick={onClose}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{isUpdate ? 'Update Query' : 'Save Query'}</h3>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Query name"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={saveDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onSave} disabled={isSaveDisabled}>
            {isUpdate ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { QueryEditor } from '../QueryEditor/QueryEditor';
import { QueryResults } from '../QueryResults/QueryResults';
import './SplitEditorPane.css';

interface SplitEditorPaneProps {
  tabId: string;
  isActive: boolean;
  onFocus: () => void;
  theme?: 'dark' | 'light';
}

export const SplitEditorPane: React.FC<SplitEditorPaneProps> = ({
  tabId,
  isActive,
  onFocus,
  theme = 'dark',
}) => {
  const [editorHeight, setEditorHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(250);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = editorHeight;
  }, [editorHeight]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStartYRef.current;
      const newHeight = Math.max(100, Math.min(500, resizeStartHeightRef.current + diff));
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      className={`split-editor-pane ${isActive ? 'active' : ''}`}
      onClick={onFocus}
    >
      <div className="split-pane-editor" style={{ height: `${editorHeight}px` }}>
        <QueryEditor key={tabId} theme={theme} tabId={tabId} onFocus={onFocus} />
      </div>
      <div
        className="split-pane-resize-handle"
        onMouseDown={handleResizeStart}
      />
      <div className="split-pane-results" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
        <QueryResults tabId={tabId} />
      </div>
    </div>
  );
};

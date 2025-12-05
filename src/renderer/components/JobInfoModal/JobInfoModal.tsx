import React, { useState, useEffect } from 'react';
import type { JobDetails } from '../../../shared/types/bigquery';
import './JobInfoModal.css';

interface JobInfoModalProps {
  jobId: string;
  onClose: () => void;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration from milliseconds
 */
function formatDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return 'N/A';
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const ms = end - start;
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format slot time (milliseconds to readable format)
 */
function formatSlotTime(ms: number): string {
  if (ms === 0) return '0 slot-ms';
  if (ms < 1000) return `${ms} slot-ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)} slot-seconds`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)} slot-minutes`;
  return `${(ms / 3600000).toFixed(2)} slot-hours`;
}

/**
 * Format timestamp to local string
 */
function formatTimestamp(isoString: string): string {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString();
}

export const JobInfoModal: React.FC<JobInfoModalProps> = ({ jobId, onClose }) => {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobInfo = async () => {
      if (!window.electronAPI) {
        setError('Electron API not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.bigquery.getJobInfo(jobId);
        setJobDetails(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load job information');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobInfo();
  }, [jobId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId);
  };

  return (
    <div className="job-info-modal-overlay" onClick={handleOverlayClick}>
      <div className="job-info-modal-dialog">
        <div className="job-info-modal-header">
          <h2>Job Details</h2>
          <button className="job-info-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="job-info-modal-content">
          {isLoading && (
            <div className="job-info-loading">
              <div className="job-info-spinner"></div>
              <div>Loading job information...</div>
            </div>
          )}
          {error && (
            <div className="job-info-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!isLoading && !error && jobDetails && (
            <div className="job-info-details">
              {/* Basic Job Info */}
              <section className="job-info-section">
                <h3>Job Information</h3>
                <div className="job-info-grid">
                  <div className="job-info-row">
                    <span className="job-info-label">Job ID</span>
                    <span className="job-info-value job-id-value">
                      <code>{jobDetails.jobId}</code>
                      <button 
                        className="job-info-copy-btn" 
                        onClick={handleCopyJobId}
                        title="Copy job ID"
                      >
                        📋
                      </button>
                    </span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Project</span>
                    <span className="job-info-value">{jobDetails.projectId}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Location</span>
                    <span className="job-info-value">{jobDetails.location || 'N/A'}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">User</span>
                    <span className="job-info-value">{jobDetails.user || 'N/A'}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Status</span>
                    <span className={`job-info-value job-status job-status-${jobDetails.state.toLowerCase()}`}>
                      {jobDetails.state}
                    </span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Statement Type</span>
                    <span className="job-info-value">{jobDetails.statementType}</span>
                  </div>
                </div>
              </section>

              {/* Timing Info */}
              <section className="job-info-section">
                <h3>Timing</h3>
                <div className="job-info-grid">
                  <div className="job-info-row">
                    <span className="job-info-label">Created</span>
                    <span className="job-info-value">{formatTimestamp(jobDetails.creationTime)}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Started</span>
                    <span className="job-info-value">{formatTimestamp(jobDetails.startTime)}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Ended</span>
                    <span className="job-info-value">{formatTimestamp(jobDetails.endTime)}</span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Duration</span>
                    <span className="job-info-value job-info-highlight">
                      {formatDuration(jobDetails.startTime, jobDetails.endTime)}
                    </span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Slot Time</span>
                    <span className="job-info-value">{formatSlotTime(jobDetails.totalSlotMs)}</span>
                  </div>
                </div>
              </section>

              {/* Data Processing */}
              <section className="job-info-section">
                <h3>Data Processing</h3>
                <div className="job-info-grid">
                  <div className="job-info-row">
                    <span className="job-info-label">Bytes Processed</span>
                    <span className="job-info-value job-info-highlight">
                      {formatBytes(jobDetails.totalBytesProcessed)}
                    </span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Bytes Billed</span>
                    <span className="job-info-value job-info-highlight">
                      {formatBytes(jobDetails.totalBytesBilled)}
                    </span>
                  </div>
                  <div className="job-info-row">
                    <span className="job-info-label">Cache Hit</span>
                    <span className={`job-info-value ${jobDetails.cacheHit ? 'job-info-success' : ''}`}>
                      {jobDetails.cacheHit ? '✓ Yes' : 'No'}
                    </span>
                  </div>
                  {jobDetails.billingTier && (
                    <div className="job-info-row">
                      <span className="job-info-label">Billing Tier</span>
                      <span className="job-info-value">{jobDetails.billingTier}</span>
                    </div>
                  )}
                  {jobDetails.outputRows !== undefined && (
                    <div className="job-info-row">
                      <span className="job-info-label">Output Rows</span>
                      <span className="job-info-value">{jobDetails.outputRows.toLocaleString()}</span>
                    </div>
                  )}
                  {jobDetails.numDmlAffectedRows !== undefined && (
                    <div className="job-info-row">
                      <span className="job-info-label">Rows Affected</span>
                      <span className="job-info-value">{jobDetails.numDmlAffectedRows.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Referenced Tables */}
              {jobDetails.referencedTables && jobDetails.referencedTables.length > 0 && (
                <section className="job-info-section">
                  <h3>Referenced Tables</h3>
                  <div className="job-info-tables">
                    {jobDetails.referencedTables.map((table, index) => (
                      <div key={index} className="job-info-table-item">
                        <code>{table.projectId}.{table.datasetId}.{table.tableId}</code>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Error Info */}
              {jobDetails.errorResult && (
                <section className="job-info-section job-info-error-section">
                  <h3>Error Details</h3>
                  <div className="job-info-grid">
                    <div className="job-info-row">
                      <span className="job-info-label">Reason</span>
                      <span className="job-info-value">{jobDetails.errorResult.reason}</span>
                    </div>
                    <div className="job-info-row">
                      <span className="job-info-label">Location</span>
                      <span className="job-info-value">{jobDetails.errorResult.location}</span>
                    </div>
                    <div className="job-info-row">
                      <span className="job-info-label">Message</span>
                      <span className="job-info-value">{jobDetails.errorResult.message}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

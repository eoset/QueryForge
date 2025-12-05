import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobInfoModal } from '../../../../src/renderer/components/JobInfoModal/JobInfoModal';
import type { JobDetails } from '../../../../src/shared/types/bigquery';

// Get the mocked electronAPI from the global window
const mockElectronAPI = (window as any).electronAPI;

// Mock job details for testing
const mockJobDetails: JobDetails = {
  jobId: 'test-job-123',
  projectId: 'test-project',
  location: 'EU',
  user: 'test@example.com',
  creationTime: '2025-12-05T10:00:00.000Z',
  startTime: '2025-12-05T10:00:01.000Z',
  endTime: '2025-12-05T10:00:05.000Z',
  totalSlotMs: 5000,
  totalBytesProcessed: 1073741824, // 1 GB
  totalBytesBilled: 1073741824,
  cacheHit: false,
  statementType: 'SELECT',
  outputRows: 1000,
  billingTier: 1,
  referencedTables: [
    { projectId: 'test-project', datasetId: 'test_dataset', tableId: 'test_table' },
  ],
  state: 'DONE',
};

describe('JobInfoModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock for getJobInfo
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockResolvedValue(mockJobDetails);
  });

  it('should render loading state initially', () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    expect(screen.getByText('Loading job information...')).toBeInTheDocument();
  });

  it('should render job details after loading', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    // Check that job ID is displayed
    expect(screen.getByText('test-job-123')).toBeInTheDocument();
    
    // Check project ID
    expect(screen.getByText('test-project')).toBeInTheDocument();
    
    // Check location
    expect(screen.getByText('EU')).toBeInTheDocument();
    
    // Check user
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should display bytes processed in human readable format', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    // 1 GB should be displayed
    expect(screen.getAllByText('1 GB').length).toBeGreaterThan(0);
  });

  it('should display cache hit status', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('should display cache hit as Yes when cacheHit is true', async () => {
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockResolvedValue({
      ...mockJobDetails,
      cacheHit: true,
    });

    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('✓ Yes')).toBeInTheDocument();
    });
  });

  it('should display referenced tables', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Referenced Tables')).toBeInTheDocument();
    });

    expect(screen.getByText('test-project.test_dataset.test_table')).toBeInTheDocument();
  });

  it('should display output rows', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    const overlay = document.querySelector('.job-info-modal-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call onClose when clicking dialog content', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    const dialog = document.querySelector('.job-info-modal-dialog');
    fireEvent.click(dialog!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when escape key is pressed', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message when loading fails', async () => {
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockRejectedValue(
      new Error('Job not found')
    );

    render(<JobInfoModal jobId="invalid-job" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Job not found/)).toBeInTheDocument();
    });
  });

  it('should copy job ID when copy button is clicked', async () => {
    const mockClipboard = { writeText: jest.fn() };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy job ID');
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('test-job-123');
  });

  it('should display job status with correct styling', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('DONE')).toBeInTheDocument();
    });

    const statusElement = screen.getByText('DONE');
    expect(statusElement).toHaveClass('job-status-done');
  });

  it('should display statement type', async () => {
    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('SELECT')).toBeInTheDocument();
    });
  });

  it('should display error details when job has error', async () => {
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockResolvedValue({
      ...mockJobDetails,
      state: 'DONE',
      errorResult: {
        reason: 'invalidQuery',
        location: 'query',
        message: 'Syntax error at line 1',
      },
    });

    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });

    expect(screen.getByText('invalidQuery')).toBeInTheDocument();
    expect(screen.getByText('Syntax error at line 1')).toBeInTheDocument();
  });

  it('should display DML affected rows for DML queries', async () => {
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockResolvedValue({
      ...mockJobDetails,
      statementType: 'UPDATE',
      outputRows: undefined,
      numDmlAffectedRows: 500,
    });

    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Rows Affected')).toBeInTheDocument();
    });

    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('should not display referenced tables section when empty', async () => {
    mockElectronAPI.bigquery.getJobInfo = jest.fn().mockResolvedValue({
      ...mockJobDetails,
      referencedTables: undefined,
    });

    render(<JobInfoModal jobId="test-job-123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('Referenced Tables')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionDialog } from '../../../../src/renderer/components/ConnectionDialog/ConnectionDialog';

// Mock the stores
jest.mock('../../../../src/renderer/stores/connection-store', () => ({
  useConnectionStore: () => ({
    setConnection: jest.fn(),
    setConnecting: jest.fn(),
    setConnectionError: jest.fn(),
  }),
}));

// Mock validateConnectionConfig
jest.mock('../../../../src/shared/utils/connection-validation', () => ({
  validateConnectionConfig: jest.fn(() => ({ valid: true })),
}));

describe('ConnectionDialog', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset electronAPI mocks
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(null);
    (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.connection.configure as jest.Mock).mockResolvedValue(undefined);
    (window.electronAPI.connection.getActive as jest.Mock).mockResolvedValue({
      projectId: 'test-project',
      authType: 'application-default',
      location: 'EU',
      isActive: true,
    });
  });

  it('should render the dialog', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByText('Connect to BigQuery')).toBeInTheDocument();
  });

  it('should render project ID input', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/project id/i)).toBeInTheDocument();
  });

  it('should render location dropdown', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it('should render authentication method dropdown', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/authentication method/i)).toBeInTheDocument();
  });

  it('should show service account fields when service-account auth is selected', async () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    // Service account is the default, so the fields should be visible
    expect(screen.getByLabelText(/service account key file path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paste service account key json/i)).toBeInTheDocument();
  });

  it('should hide service account fields when application-default is selected', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    expect(screen.queryByLabelText(/service account key file path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/paste service account key json/i)).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const overlay = document.querySelector('.connection-dialog-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call onClose when clicking dialog content', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const dialog = document.querySelector('.connection-dialog');
    fireEvent.click(dialog!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable connect button when project ID is empty', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).toBeDisabled();
  });

  it('should enable connect button when project ID is provided', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'my-test-project');

    const connectButton = screen.getByRole('button', { name: /connect/i });
    expect(connectButton).not.toBeDisabled();
  });

  it('should load saved connection on mount', async () => {
    const savedConnection = {
      projectId: 'saved-project',
      authType: 'service-account' as const,
      serviceAccountKeyPath: '/path/to/key.json',
      location: 'US',
      enableDbtSupport: true,
    };
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(savedConnection);

    render(<ConnectionDialog onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/project id/i)).toHaveValue('saved-project');
    });
  });

  it('should show dbt support checkbox', () => {
    render(<ConnectionDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText(/enable dbt syntax support/i)).toBeInTheDocument();
  });

  it('should toggle dbt support checkbox', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    const dbtCheckbox = screen.getByLabelText(/enable dbt syntax support/i);
    expect(dbtCheckbox).not.toBeChecked();

    await user.click(dbtCheckbox);
    expect(dbtCheckbox).toBeChecked();
  });

  it('should attempt connection when connect button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionDialog onClose={mockOnClose} />);

    // Select application-default auth to avoid service account validation
    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    // Enter project ID
    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'my-test-project');

    // Click connect
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    await waitFor(() => {
      expect(window.electronAPI.connection.test).toHaveBeenCalled();
    });
  });

  it('should show error message when connection fails', async () => {
    const user = userEvent.setup();
    const { validateConnectionConfig } = require('../../../../src/shared/utils/connection-validation');
    validateConnectionConfig.mockReturnValue({ valid: false, error: 'Invalid project ID' });

    render(<ConnectionDialog onClose={mockOnClose} />);

    // Select application-default auth
    const authSelect = screen.getByLabelText(/authentication method/i);
    await user.selectOptions(authSelect, 'application-default');

    // Enter project ID
    const projectIdInput = screen.getByLabelText(/project id/i);
    await user.type(projectIdInput, 'invalid');

    // Click connect
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid project ID')).toBeInTheDocument();
    });
  });
});

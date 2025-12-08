/**
 * LLM Settings Dialog Component
 * Allows users to configure LLM providers (OpenAI, Azure, Gemini)
 */

import React, { useState, useEffect } from 'react';
import { useLLMStore } from '../../stores/llm-store';
import type {
  LLMProvider,
  LLMConfig,
  OpenAIConfig,
  AzureOpenAIConfig,
  GeminiConfig,
} from '../../../shared/types/llm';
import { AVAILABLE_MODELS, DEFAULT_MODELS, DEFAULT_SYSTEM_PROMPT } from '../../../shared/types/llm';
import './LLMSettingsDialog.css';

interface LLMSettingsDialogProps {
  onClose: () => void;
}

type ProviderTab = 'openai' | 'azure' | 'gemini';

export const LLMSettingsDialog: React.FC<LLMSettingsDialogProps> = ({ onClose }) => {
  const { activeProvider, loadSettings, setActiveProvider } = useLLMStore();
  
  const [selectedTab, setSelectedTab] = useState<ProviderTab>('openai');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // OpenAI form state
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState(DEFAULT_MODELS.openai);
  const [openaiOrg, setOpenaiOrg] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('');
  const [openaiHasKey, setOpenaiHasKey] = useState(false);
  
  // Azure form state
  const [azureApiKey, setAzureApiKey] = useState('');
  const [azureEndpoint, setAzureEndpoint] = useState('');
  const [azureDeployment, setAzureDeployment] = useState('');
  const [azureModel, setAzureModel] = useState(DEFAULT_MODELS.azure);
  const [azureApiVersion, setAzureApiVersion] = useState('2024-12-01-preview');
  const [azureHasKey, setAzureHasKey] = useState(false);
  
  // Gemini form state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState(DEFAULT_MODELS.gemini);
  const [geminiHasKey, setGeminiHasKey] = useState(false);

  // Load existing settings
  useEffect(() => {
    const loadExistingSettings = async () => {
      if (!window.electronAPI?.llm) return;
      
      try {
        // Load system prompt
        const prompt = await window.electronAPI.llm.getSystemPrompt();
        setSystemPrompt(prompt || DEFAULT_SYSTEM_PROMPT);
        
        // Load OpenAI config
        const openaiConfig = await window.electronAPI.llm.getProviderConfig('openai');
        if (openaiConfig) {
          setOpenaiModel((openaiConfig as Omit<OpenAIConfig, 'apiKey'>).model || DEFAULT_MODELS.openai);
          setOpenaiOrg((openaiConfig as Omit<OpenAIConfig, 'apiKey'>).organization || '');
          setOpenaiBaseUrl((openaiConfig as Omit<OpenAIConfig, 'apiKey'>).baseUrl || '');
        }
        setOpenaiHasKey(await window.electronAPI.llm.hasApiKey('openai'));
        
        // Load Azure config
        const azureConfig = await window.electronAPI.llm.getProviderConfig('azure');
        if (azureConfig) {
          setAzureEndpoint((azureConfig as Omit<AzureOpenAIConfig, 'apiKey'>).endpoint || '');
          setAzureDeployment((azureConfig as Omit<AzureOpenAIConfig, 'apiKey'>).deploymentName || '');
          setAzureModel((azureConfig as Omit<AzureOpenAIConfig, 'apiKey'>).model || DEFAULT_MODELS.azure);
          setAzureApiVersion((azureConfig as Omit<AzureOpenAIConfig, 'apiKey'>).apiVersion || '2024-12-01-preview');
        }
        setAzureHasKey(await window.electronAPI.llm.hasApiKey('azure'));
        
        // Load Gemini config
        const geminiConfig = await window.electronAPI.llm.getProviderConfig('gemini');
        if (geminiConfig) {
          setGeminiModel((geminiConfig as Omit<GeminiConfig, 'apiKey'>).model || DEFAULT_MODELS.gemini);
        }
        setGeminiHasKey(await window.electronAPI.llm.hasApiKey('gemini'));
        
        // Set initial tab based on active provider
        const active = await window.electronAPI.llm.getActiveProvider();
        if (active) {
          setSelectedTab(active);
        }
      } catch (error) {
        console.error('Failed to load LLM settings:', error);
      }
    };
    
    loadExistingSettings();
  }, []);

  const handleSaveOpenAI = async () => {
    if (!window.electronAPI?.llm) return;
    
    setIsSaving(true);
    setTestResult(null);
    
    try {
      const config: OpenAIConfig = {
        provider: 'openai',
        apiKey: openaiApiKey || '', // Empty string if not changing
        model: openaiModel,
        organization: openaiOrg || undefined,
        baseUrl: openaiBaseUrl || undefined,
      };
      
      // Only save if there's a new API key or we already have one
      if (openaiApiKey || openaiHasKey) {
        if (openaiApiKey) {
          await window.electronAPI.llm.configureProvider(config);
        }
        setOpenaiHasKey(true);
        setOpenaiApiKey(''); // Clear the input after saving
        setTestResult({ success: true, message: 'OpenAI configuration saved!' });
      } else {
        setTestResult({ success: false, message: 'Please enter an API key' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAzure = async () => {
    if (!window.electronAPI?.llm) return;
    
    setIsSaving(true);
    setTestResult(null);
    
    try {
      if (!azureEndpoint || !azureDeployment) {
        setTestResult({ success: false, message: 'Please fill in endpoint and deployment name' });
        setIsSaving(false);
        return;
      }
      
      const config: AzureOpenAIConfig = {
        provider: 'azure',
        apiKey: azureApiKey || '',
        endpoint: azureEndpoint,
        deploymentName: azureDeployment,
        model: azureModel,
        apiVersion: azureApiVersion,
      };
      
      if (azureApiKey || azureHasKey) {
        if (azureApiKey) {
          await window.electronAPI.llm.configureProvider(config);
        }
        setAzureHasKey(true);
        setAzureApiKey('');
        setTestResult({ success: true, message: 'Azure OpenAI configuration saved!' });
      } else {
        setTestResult({ success: false, message: 'Please enter an API key' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGemini = async () => {
    if (!window.electronAPI?.llm) return;
    
    setIsSaving(true);
    setTestResult(null);
    
    try {
      const config: GeminiConfig = {
        provider: 'gemini',
        apiKey: geminiApiKey || '',
        model: geminiModel,
      };
      
      if (geminiApiKey || geminiHasKey) {
        if (geminiApiKey) {
          await window.electronAPI.llm.configureProvider(config);
        }
        setGeminiHasKey(true);
        setGeminiApiKey('');
        setTestResult({ success: true, message: 'Gemini configuration saved!' });
      } else {
        setTestResult({ success: false, message: 'Please enter an API key' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!window.electronAPI?.llm) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await window.electronAPI.llm.testConnection(selectedTab);
      setTestResult({
        success: result.success,
        message: result.success 
          ? 'Connection successful!' 
          : result.error || 'Connection failed. Please check your configuration.',
      });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetActive = async (provider: LLMProvider) => {
    if (!window.electronAPI?.llm) return;
    
    try {
      await setActiveProvider(provider);
      setTestResult({ success: true, message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} is now the active provider` });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to set active provider' });
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!window.electronAPI?.llm) return;
    
    try {
      await window.electronAPI.llm.saveSystemPrompt(systemPrompt);
      setTestResult({ success: true, message: 'System prompt saved!' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to save system prompt' });
    }
  };

  const handleDeleteProvider = async (provider: LLMProvider) => {
    if (!window.electronAPI?.llm) return;
    
    try {
      await window.electronAPI.llm.deleteProviderConfig(provider);
      
      switch (provider) {
        case 'openai':
          setOpenaiHasKey(false);
          setOpenaiApiKey('');
          break;
        case 'azure':
          setAzureHasKey(false);
          setAzureApiKey('');
          break;
        case 'gemini':
          setGeminiHasKey(false);
          setGeminiApiKey('');
          break;
      }
      
      await loadSettings();
      setTestResult({ success: true, message: `${provider} configuration deleted` });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to delete configuration' });
    }
  };

  const renderProviderTab = () => {
    switch (selectedTab) {
      case 'openai':
        return (
          <div className="llm-settings-form">
            <div className="llm-settings-field">
              <label>API Key {openaiHasKey && <span className="key-configured">✓ Configured</span>}</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder={openaiHasKey ? '••••••••••••••••' : 'sk-...'}
              />
              <span className="field-hint">Get your API key from platform.openai.com</span>
            </div>
            
            <div className="llm-settings-field">
              <label>Model</label>
              <select value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}>
                {AVAILABLE_MODELS.openai.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="llm-settings-field">
              <label>Organization ID (optional)</label>
              <input
                type="text"
                value={openaiOrg}
                onChange={(e) => setOpenaiOrg(e.target.value)}
                placeholder="org-..."
              />
            </div>
            
            <div className="llm-settings-field">
              <label>Base URL (optional)</label>
              <input
                type="text"
                value={openaiBaseUrl}
                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <span className="field-hint">Leave empty for default OpenAI API</span>
            </div>
            
            <div className="llm-settings-actions">
              <button onClick={handleSaveOpenAI} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button onClick={handleTestConnection} disabled={isTesting || !openaiHasKey}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              {openaiHasKey && activeProvider !== 'openai' && (
                <button onClick={() => handleSetActive('openai')} className="btn-primary">
                  Set as Active
                </button>
              )}
              {openaiHasKey && (
                <button onClick={() => handleDeleteProvider('openai')} className="btn-danger">
                  Delete
                </button>
              )}
            </div>
          </div>
        );
        
      case 'azure':
        return (
          <div className="llm-settings-form">
            <div className="llm-settings-field">
              <label>API Key {azureHasKey && <span className="key-configured">✓ Configured</span>}</label>
              <input
                type="password"
                value={azureApiKey}
                onChange={(e) => setAzureApiKey(e.target.value)}
                placeholder={azureHasKey ? '••••••••••••••••' : 'Enter API key'}
              />
            </div>
            
            <div className="llm-settings-field">
              <label>Endpoint URL</label>
              <input
                type="text"
                value={azureEndpoint}
                onChange={(e) => setAzureEndpoint(e.target.value)}
                placeholder="https://your-resource.openai.azure.com"
              />
            </div>
            
            <div className="llm-settings-field">
              <label>Deployment Name</label>
              <input
                type="text"
                value={azureDeployment}
                onChange={(e) => setAzureDeployment(e.target.value)}
                placeholder="your-deployment-name"
              />
            </div>
            
            <div className="llm-settings-field">
              <label>Model</label>
              <select value={azureModel} onChange={(e) => setAzureModel(e.target.value)}>
                {AVAILABLE_MODELS.azure.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="llm-settings-field">
              <label>API Version</label>
              <input
                type="text"
                value={azureApiVersion}
                onChange={(e) => setAzureApiVersion(e.target.value)}
                placeholder="2024-12-01-preview"
              />
            </div>
            
            <div className="llm-settings-actions">
              <button onClick={handleSaveAzure} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button onClick={handleTestConnection} disabled={isTesting || !azureHasKey}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              {azureHasKey && activeProvider !== 'azure' && (
                <button onClick={() => handleSetActive('azure')} className="btn-primary">
                  Set as Active
                </button>
              )}
              {azureHasKey && (
                <button onClick={() => handleDeleteProvider('azure')} className="btn-danger">
                  Delete
                </button>
              )}
            </div>
          </div>
        );
        
      case 'gemini':
        return (
          <div className="llm-settings-form">
            <div className="llm-settings-field">
              <label>API Key {geminiHasKey && <span className="key-configured">✓ Configured</span>}</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={geminiHasKey ? '••••••••••••••••' : 'Enter API key'}
              />
              <span className="field-hint">Get your API key from ai.google.dev</span>
            </div>
            
            <div className="llm-settings-field">
              <label>Model</label>
              <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)}>
                {AVAILABLE_MODELS.gemini.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="llm-settings-actions">
              <button onClick={handleSaveGemini} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button onClick={handleTestConnection} disabled={isTesting || !geminiHasKey}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              {geminiHasKey && activeProvider !== 'gemini' && (
                <button onClick={() => handleSetActive('gemini')} className="btn-primary">
                  Set as Active
                </button>
              )}
              {geminiHasKey && (
                <button onClick={() => handleDeleteProvider('gemini')} className="btn-danger">
                  Delete
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="llm-settings-overlay" onClick={onClose}>
      <div className="llm-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="llm-settings-header">
          <h2>AI Provider Settings</h2>
          <button className="llm-settings-close" onClick={onClose}>×</button>
        </div>
        
        <div className="llm-settings-content">
          {/* Provider Tabs */}
          <div className="llm-settings-tabs">
            <button
              className={`llm-settings-tab ${selectedTab === 'openai' ? 'active' : ''} ${activeProvider === 'openai' ? 'is-active-provider' : ''}`}
              onClick={() => { setSelectedTab('openai'); setTestResult(null); }}
            >
              OpenAI {activeProvider === 'openai' && '✓'}
            </button>
            <button
              className={`llm-settings-tab ${selectedTab === 'azure' ? 'active' : ''} ${activeProvider === 'azure' ? 'is-active-provider' : ''}`}
              onClick={() => { setSelectedTab('azure'); setTestResult(null); }}
            >
              Azure OpenAI {activeProvider === 'azure' && '✓'}
            </button>
            <button
              className={`llm-settings-tab ${selectedTab === 'gemini' ? 'active' : ''} ${activeProvider === 'gemini' ? 'is-active-provider' : ''}`}
              onClick={() => { setSelectedTab('gemini'); setTestResult(null); }}
            >
              Google Gemini {activeProvider === 'gemini' && '✓'}
            </button>
          </div>
          
          {/* Test Result */}
          {testResult && (
            <div className={`llm-settings-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}
          
          {/* Provider Form */}
          {renderProviderTab()}
          
          {/* System Prompt Section */}
          <div className="llm-settings-section">
            <h3>System Prompt</h3>
            <p className="section-description">
              Customize the instructions given to the AI assistant
            </p>
            <textarea
              className="llm-settings-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Enter system prompt..."
            />
            <div className="llm-settings-actions">
              <button onClick={handleSaveSystemPrompt}>Save System Prompt</button>
              <button onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}>Reset to Default</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

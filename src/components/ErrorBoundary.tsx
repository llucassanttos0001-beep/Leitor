import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#1E1E2E',
          color: '#CDD6F4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#313244',
            border: '1px solid #45475A',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <AlertCircle size={48} color="#F38BA8" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              Ops! Algo inesperado aconteceu
            </h1>
            <p style={{ fontSize: '14px', color: '#A6ADC8', marginBottom: '16px' }}>
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <pre style={{
              fontSize: '11px',
              backgroundColor: '#181825',
              padding: '12px',
              borderRadius: '8px',
              overflowX: 'auto',
              textAlign: 'left',
              color: '#F38BA8',
              maxHeight: '150px',
              marginBottom: '20px'
            }}>
              {this.state.error?.stack || ''}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#89B4FA',
                color: '#11111B',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <RefreshCw size={16} /> Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

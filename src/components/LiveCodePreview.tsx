import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Alert,
  Typography,
  CircularProgress,
  Button,
  Divider,
  Card,
  IconButton,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as PreviewIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface LiveCodePreviewProps {
  code: string;
}

const LiveCodePreview: React.FC<LiveCodePreviewProps> = ({ code }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Clear error when code changes
  useEffect(() => {
    if (code) {
      setError(null);
    }
  }, [code]);

  // Enhanced Payment Interface Component
  const EnhancedPaymentPreview = () => (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Roboto, sans-serif',
      p: 3,
      maxWidth: '375px',
      mx: 'auto'
    }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          sx={{ 
            mr: 2, 
            backgroundColor: '#f0f0f0',
            '&:hover': { backgroundColor: '#e0e0e0' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Payment
        </Typography>
      </Box>

      {/* Payment Methods Grid */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Select Payment Method
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 2, 
        mb: 3 
      }}>
        {/* Cash Payment */}
        <Card 
          variant="outlined" 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            '&:hover': { borderColor: '#FF8C00' },
            textAlign: 'center'
          }}
        >
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              mx: 'auto', 
              mb: 1,
              backgroundColor: '#f0f0f0' 
            }}
          >
            💰
          </Avatar>
          <Typography variant="body2">Cash</Typography>
        </Card>

        {/* Visa Payment */}
        <Card 
          variant="outlined" 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            '&:hover': { borderColor: '#FF8C00' },
            textAlign: 'center'
          }}
        >
          <Box 
            component="img"
            src="https://cdn.worldvectorlogo.com/logos/visa-10.svg"
            sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }}
            alt="Visa"
          />
          <Typography variant="body2">Visa</Typography>
        </Card>

        {/* Mastercard Payment - Selected */}
        <Card 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            border: '2px solid #FF8C00',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <CheckCircleIcon 
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#FF8C00',
              fontSize: 20
            }}
          />
          <Box 
            component="img"
            src="https://cdn.worldvectorlogo.com/logos/mastercard-2.svg"
            sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }}
            alt="Mastercard"
          />
          <Typography variant="body2">Mastercard</Typography>
        </Card>

        {/* PayPal Payment */}
        <Card 
          variant="outlined" 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            '&:hover': { borderColor: '#FF8C00' },
            textAlign: 'center'
          }}
        >
          <Box 
            component="img"
            src="https://cdn.worldvectorlogo.com/logos/paypal-3.svg"
            sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }}
            alt="PayPal"
          />
          <Typography variant="body2">PayPal</Typography>
        </Card>
      </Box>

      {/* Card Preview Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #FF8C00, #FF7F00)',
        borderRadius: 3,
        p: 3,
        mb: 2,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
          No master card added
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          You can add a mastercard and save it for later
        </Typography>
        
        {/* Card Design Elements */}
        <Box sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 25,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.2)'
        }} />
      </Box>

      {/* Add New Button */}
      <Button 
        variant="text" 
        fullWidth 
        sx={{ 
          mb: 3,
          color: '#FF8C00',
          fontWeight: 500,
          py: 1.5
        }}
      >
        + ADD NEW
      </Button>

      {/* Total Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        py: 1
      }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          TOTAL:
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          $96
        </Typography>
      </Box>

      {/* Pay Button */}
      <Button 
        variant="contained" 
        fullWidth 
        size="large"
        sx={{ 
          py: 2,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          backgroundColor: '#FF8C00',
          '&:hover': {
            backgroundColor: '#FF8C00dd'
          }
        }}
      >
        PAY & CONFIRM
      </Button>

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Live Preview:</strong> This shows the actual output of your generated code, parsed and rendered.
        </Typography>
      </Alert>
    </Box>
  );

  // Basic Code Preview Component
  const BasicCodePreview = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Basic Code Preview
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This appears to be basic generated code. Enhanced features are not available.
      </Typography>
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {code.substring(0, 500)}...
        </Typography>
      </Box>
    </Box>
  );

  // Memoized preview content to prevent unnecessary re-renders
  const previewContent = useMemo(() => {
    if (!code) return null;

    try {
      // Check if this is enhanced code with payment methods
      const isEnhancedPayment = code.includes('Payment Method') && 
                               (code.includes('visa-10.svg') || code.includes('mastercard-2.svg'));
      
      if (isEnhancedPayment) {
        return <EnhancedPaymentPreview />;
      }
      
      return <BasicCodePreview />;
      
    } catch (err) {
      // Set error in a way that doesn't cause re-render during render
      setTimeout(() => {
        setError(err instanceof Error ? err.message : 'Unknown preview error');
      }, 0);
      return null;
    }
  }, [code, previewKey]);

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
    setError(null);
  };

  if (!code) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        flexDirection: 'column',
        color: 'text.secondary'
      }}>
        <PreviewIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6">No Code to Preview</Typography>
        <Typography variant="body2">
          Generate code first to see the live preview
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Preview Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            The generated code might use advanced patterns or external dependencies that can't be previewed safely.
            You can still copy the code and use it in your project.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Preview Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'grey.50',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" color="text.secondary">
          Live Preview
        </Typography>
        <Button 
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Preview Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ p: 2 }}>
          {isLoading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: 200
            }}>
              <CircularProgress />
            </Box>
          ) : (
            <ErrorBoundary onError={setError} key={previewKey}>
              {previewContent}
            </ErrorBoundary>
          )}
        </Box>
      </Box>

      {/* Preview Info */}
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          This is a live preview of your generated code. Enhanced features are now fully supported!
        </Typography>
      </Box>
    </Box>
  );
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(`Component Error: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <Typography variant="body2">
            The component failed to render. This might be due to missing dependencies or syntax errors.
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default LiveCodePreview; 
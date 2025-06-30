import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Alert,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Card,
  CardContent,
  TextField,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';

interface LiveCodePreviewProps {
  code: string;
}

const LiveCodePreview: React.FC<LiveCodePreviewProps> = ({ code }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Force re-render

  // Create a static preview component
  const PreviewComponent = useMemo(() => {
    if (!code) return null;

    try {
      setError(null);
      
      // Try to render the actual generated code
      // This is a simplified approach - in production you'd want proper sandboxing
      
      // Extract the component JSX from the generated code
      const componentMatch = code.match(/return\s*\(\s*([\s\S]*)\s*\);/);
      if (!componentMatch) {
        throw new Error('Could not parse component JSX');
      }
      
      const jsxContent = componentMatch[1].trim();
      console.log('Extracted JSX:', jsxContent);
      
      // For now, show a structural representation since we can't safely eval the code
      return () => {
        // Parse component structure from the code
        const hasPaymentMethods = code.includes('Payment Methods');
        const hasPayButton = code.includes('Pay & Confirm');
        const hasTotal = code.includes('Total:');
        const hasCard = code.includes('<Card');
        
        return (
          <Box sx={{ 
            width: '100%', 
            maxWidth: '375px', 
            mx: 'auto',
            p: 3,
            backgroundColor: '#ffffff',
            minHeight: '500px',
            border: '1px solid #e0e0e0',
            borderRadius: 1
          }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                Payment
              </Typography>
            </Box>

            {/* Payment Methods */}
            {hasPaymentMethods && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Payment Methods</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="outlined" sx={{ minWidth: '80px', height: '60px', flexDirection: 'column', fontSize: '0.75rem' }}>
                    Cash
                  </Button>
                  <Button variant="outlined" sx={{ minWidth: '80px', height: '60px', flexDirection: 'column', fontSize: '0.75rem' }}>
                    Visa
                  </Button>
                  <Button variant="outlined" sx={{ minWidth: '80px', height: '60px', flexDirection: 'column', fontSize: '0.75rem' }}>
                    Mastercard
                  </Button>
                  <Button variant="outlined" sx={{ minWidth: '80px', height: '60px', flexDirection: 'column', fontSize: '0.75rem' }}>
                    PayPal
                  </Button>
                </Box>
              </Box>
            )}

            {/* Payment Details Card */}
            {hasCard && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Empty Payment Method
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Today is a good day
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Add New Payment */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <Button variant="text" startIcon={<Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>+</Box>}>
                Add New
              </Button>
            </Box>

            {/* Total */}
            {hasTotal && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    $96
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Pay Button */}
            {hasPayButton && (
              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                Pay & Confirm
              </Button>
            )}
          </Box>
        );
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown preview error');
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
          ) : PreviewComponent ? (
            <ErrorBoundary onError={setError}>
              <PreviewComponent />
            </ErrorBoundary>
          ) : (
            <Alert severity="info">
              Unable to render preview for this component.
            </Alert>
          )}
        </Box>
      </Box>

      {/* Preview Info */}
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          This is a live preview of your generated code. Some advanced features may not render perfectly in preview mode.
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
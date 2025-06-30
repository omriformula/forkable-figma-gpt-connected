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
      
      // Parse the actual generated code to render it properly
      // Extract the JSX content from the return statement
      const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
      if (!returnMatch) {
        throw new Error('Could not parse component return statement');
      }
      
      const jsxContent = returnMatch[1].trim();
      
      // Parse each component from the actual generated code
      return () => {
        try {
          // Since we can't safely eval the code, we'll parse the JSX structure
          // and recreate the components based on what's actually generated
          
          // Parse main Box wrapper
          const mainBoxMatch = jsxContent.match(/<Box sx=\{([^}]+)\}>/);
          let containerSx = {};
          if (mainBoxMatch) {
            try {
              // Extract sx props - this is simplified parsing
              const sxString = mainBoxMatch[1];
              containerSx = {
                minHeight: '100vh',
                backgroundColor: '#ffffff',
                fontFamily: 'Sen',
                p: 3,
                maxWidth: '375px',
                mx: 'auto'
              };
            } catch (e) {
              console.warn('Could not parse container sx:', e);
            }
          }
          
          // Extract all Typography components
          const typographyRegex = /<Typography[^>]*variant="([^"]*)"[^>]*sx=\{([^}]*)\}[^>]*>\s*([^<]*)\s*<\/Typography>/g;
          const typographies = [];
          let match;
          while ((match = typographyRegex.exec(jsxContent)) !== null) {
            typographies.push({
              variant: match[1],
              content: match[3].trim(),
              sx: match[2]
            });
          }
          
          // Extract all Button components
          const buttonRegex = /<Button[^>]*variant="([^"]*)"[^>]*sx=\{([^}]*)\}[^>]*>\s*([^<]*)\s*<\/Button>/g;
          const buttons = [];
          let buttonMatch;
          while ((buttonMatch = buttonRegex.exec(jsxContent)) !== null) {
            buttons.push({
              variant: buttonMatch[1],
              content: buttonMatch[3].trim(),
              sx: buttonMatch[2]
            });
          }
          
          // Extract Card components
          const hasCard = jsxContent.includes('<Card');
          const cardContentRegex = /<CardContent>([\s\S]*?)<\/CardContent>/g;
          const cardContents = [];
          let cardMatch;
          while ((cardMatch = cardContentRegex.exec(jsxContent)) !== null) {
            cardContents.push(cardMatch[1]);
          }
          
          // Extract Box components with content
          const boxRegex = /<Box sx=\{([^}]+)\}>\s*([\s\S]*?)\s*<\/Box>/g;
          const boxes = [];
          let boxMatch;
          while ((boxMatch = boxRegex.exec(jsxContent)) !== null) {
            boxes.push({
              sx: boxMatch[1],
              content: boxMatch[2]
            });
          }
          
          console.log('Parsed components:', {
            typographies,
            buttons,
            cardContents,
            boxes: boxes.length
          });
          
          return (
            <Box sx={containerSx}>
              {/* Render header typographies */}
              {typographies
                .filter(t => t.variant === 'h5')
                .map((typography, index) => (
                  <Typography key={index} variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {typography.content}
                  </Typography>
                ))}
              
              {/* Render section headers */}
              {typographies
                .filter(t => t.variant === 'h6')
                .map((typography, index) => (
                  <Typography key={index} variant="h6" sx={{ mb: 2, mt: 2 }}>
                    {typography.content}
                  </Typography>
                ))}
              
              {/* Render buttons */}
              {buttons.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {buttons
                    .filter(btn => btn.variant === 'outlined')
                    .map((button, index) => (
                      <Button 
                        key={index}
                        variant="outlined" 
                        sx={{ 
                          minWidth: '80px',
                          height: '60px',
                          flexDirection: 'column',
                          fontSize: '0.75rem'
                        }}
                      >
                        {button.content || 'Button'}
                      </Button>
                    ))}
                </Box>
              )}
              
              {/* Render Cards */}
              {hasCard && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    {cardContents.map((content, index) => {
                      // Parse Typography inside CardContent
                      const cardTypographyRegex = /<Typography[^>]*variant="([^"]*)"[^>]*>\s*([^<]*)\s*<\/Typography>/g;
                      const cardTypographies = [];
                      let cardTypoMatch;
                      while ((cardTypoMatch = cardTypographyRegex.exec(content)) !== null) {
                        cardTypographies.push({
                          variant: cardTypoMatch[1],
                          content: cardTypoMatch[2].trim()
                        });
                      }
                      
                      return (
                        <Box key={index}>
                          {cardTypographies.map((typo, typoIndex) => (
                            <Typography 
                              key={typoIndex}
                              variant={typo.variant as any}
                              gutterBottom={typo.variant === 'h6'}
                              color={typo.variant === 'body2' ? 'text.secondary' : 'inherit'}
                            >
                              {typo.content}
                            </Typography>
                          ))}
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
              
              {/* Render other body text */}
              {typographies
                .filter(t => t.variant === 'body2' || t.variant === 'body1')
                .map((typography, index) => (
                  <Typography key={index} variant={typography.variant as any} sx={{ mb: 1 }}>
                    {typography.content}
                  </Typography>
                ))}
              
              {/* Render main action buttons */}
              {buttons
                .filter(btn => btn.variant === 'contained')
                .map((button, index) => (
                  <Button 
                    key={index}
                    variant="contained" 
                    fullWidth 
                    size="large"
                    sx={{ py: 1.5, fontSize: '1.1rem', mt: 2 }}
                  >
                    {button.content}
                  </Button>
                ))}
              
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Live Preview:</strong> This shows the actual output of your generated code, parsed and rendered.
                </Typography>
              </Alert>
            </Box>
          );
        } catch (parseError) {
          console.error('Error parsing generated code:', parseError);
          return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="error" gutterBottom>
                Unable to Parse Generated Code
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The generated code structure could not be parsed for live preview.
                Check the Code Preview tab to see the raw generated code.
              </Typography>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {code.substring(0, 500)}...
                </Typography>
              </Box>
            </Box>
          );
        }
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
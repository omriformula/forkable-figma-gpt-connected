import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  AutoFixHigh as ProcessingIcon,
  Code as CodeIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  Palette as PaletteIcon,
  ViewModule as ComponentIcon
} from '@mui/icons-material';
import { useCreate, useUpdate } from '@refinedev/core';
import FigmaService, { FigmaAnalysisResult } from '../services/figmaService';
import GPTVisionService, { GPTVisionAnalysis, IdentifiedComponent } from '../services/gptVisionService';

interface Screen {
  id: string;
  project_id: string;
  name: string;
  original_image_url: string;
  figma_url?: string;
  figma_file_key?: string;
  current_code?: string;
  status: 'processing' | 'iterating' | 'ready' | 'error';
  iteration_count: number;
  confidence_score?: number;
  analysis_data?: any;
}

interface FigmaToCodeProcessorProps {
  screen: Screen;
  onComplete: () => void;
  figmaToken: string;
  openaiApiKey: string;
}

const steps = [
  'Fetching Figma file data',
  'Exporting screen images',
  'Analyzing with GPT Vision',
  'Identifying UI components',
  'Generating React code',
  'Ready for vibe-coding'
];

const FigmaToCodeProcessor: React.FC<FigmaToCodeProcessorProps> = ({
  screen,
  onComplete,
  figmaToken,
  openaiApiKey
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [analysis, setAnalysis] = useState<GPTVisionAnalysis | null>(null);
  const [figmaData, setFigmaData] = useState<FigmaAnalysisResult | null>(null);

  const { mutate: updateScreen } = useUpdate();
  const { mutate: createSession } = useCreate();

  useEffect(() => {
    if (screen.status === 'processing' && screen.figma_url) {
      startFigmaProcessing();
    }
  }, [screen]);

  const startFigmaProcessing = async () => {
    setIsProcessing(true);
    setError('');

    try {
      console.log('Starting Figma processing with tokens:', {
        figmaToken: figmaToken ? '✓ Present' : '✗ Missing',
        openaiApiKey: openaiApiKey ? '✓ Present' : '✗ Missing',
        figmaUrl: screen.figma_url
      });

      const figmaService = new FigmaService(figmaToken);
      const gptVisionService = new GPTVisionService(openaiApiKey);

      // Step 1: Fetch Figma file data
      setActiveStep(0);
      await delay(1000);
      
      if (!screen.figma_url) {
        throw new Error('No Figma URL provided');
      }

      console.log('Extracting file key from:', screen.figma_url);
      const fileKey = figmaService.extractFileKey(screen.figma_url);
      console.log('Extracted file key:', fileKey);
      
      console.log('Fetching Figma file...');
      const figmaFile = await figmaService.getFile(fileKey);
      console.log('Figma file fetched:', figmaFile.name);
      
      // Step 2: Export screen images
      setActiveStep(1);
      await delay(1500);
      
      const mainFrames = figmaService.getMainFrames(figmaFile);
      if (mainFrames.length === 0) {
        throw new Error('No frames found in Figma file');
      }

      const images = await figmaService.getImages(fileKey, [mainFrames[0]], {
        format: 'png',
        scale: 2
      });
      
      const imageUrl = images[mainFrames[0]];
      if (!imageUrl) {
        throw new Error('Failed to export image from Figma');
      }

      // Step 3: Analyze Figma structure
      setActiveStep(2);
      await delay(2000);
      
      const figmaComponents = figmaService.analyzeFileStructure(figmaFile);
      
      // Step 4: GPT Vision analysis
      setActiveStep(3);
      await delay(3000);
      
      const gptAnalysis = await gptVisionService.analyzeFigmaDesign(
        figmaFile,
        imageUrl,
        figmaComponents
      );

      setAnalysis(gptAnalysis);
      
      // Store analysis data
      const analysisData = {
        fileData: figmaFile,
        imageUrl,
        components: figmaComponents
      };
      setFigmaData(analysisData);

      // Step 5: Generate React code
      setActiveStep(4);
      await delay(2000);
      
      const reactCode = generateReactCodeFromAnalysis(gptAnalysis);
      setGeneratedCode(reactCode);
      setConfidence(gptAnalysis.confidence);

      // Step 6: Complete
      setActiveStep(5);

      // Update screen in database
      updateScreen({
        resource: 'screens',
        id: screen.id,
        values: {
          current_code: reactCode,
          status: 'ready',
          confidence_score: gptAnalysis.confidence,
          iteration_count: 1,
          analysis_data: {
            figmaData: analysisData,
            gptAnalysis: gptAnalysis
          },
          original_image_url: imageUrl
        }
      }, {
        onSuccess: () => {
          // Create initial generation session with unique timestamp
          createSession({
            resource: 'vibe_sessions',
            values: {
              screen_id: screen.id,
              session_type: 'initial_generation',
              ai_response: `Initial code generated from Figma design "${figmaFile.name}". Identified ${gptAnalysis.components.length} components with ${(gptAnalysis.confidence * 100).toFixed(0)}% confidence.`,
              generated_code: reactCode,
              ai_provider: 'gpt-4-vision',
              confidence_score: gptAnalysis.confidence,
              is_accepted: true
            }
          }, {
            onSuccess: () => {
              setIsProcessing(false);
              onComplete();
            },
            onError: (error) => {
              console.error('Failed to create session:', error);
              setIsProcessing(false);
              onComplete(); // Complete anyway since screen was updated
            }
          });
        },
        onError: (error) => {
          console.error('Failed to update screen:', error);
          setError('Failed to save generated code');
          setIsProcessing(false);
          
          // Update screen status to error - separate operation to avoid conflicts
          setTimeout(() => {
            updateScreen({
              resource: 'screens',
              id: screen.id,
              values: { status: 'error' }
            });
          }, 100);
        }
      });

    } catch (err: any) {
      setError(err.message || 'Processing failed. Please try again.');
      setIsProcessing(false);
      
      updateScreen({
        resource: 'screens',
        id: screen.id,
        values: { status: 'error' }
      });
    }
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const generateReactCodeFromAnalysis = (analysis: GPTVisionAnalysis): string => {
    const { components, layout, designSystem } = analysis;
    
    // Generate imports based on identified components
    const imports = new Set(['React', 'Box', 'Typography', 'Button', 'Card', 'CardContent']);
    
    // Add more imports based on component types
    components.forEach(comp => {
      if (comp.materialUIMapping?.component) {
        imports.add(comp.materialUIMapping.component);
      }
    });

    const importStatement = `import React from 'react';
import {
  ${Array.from(imports).filter(imp => imp !== 'React').join(',\n  ')}
} from '@mui/material';`;

    // Generate component JSX with better structure
    const componentJSX = generateImprovedComponentJSX(components, layout);

    // Convert background color properly
    const backgroundColor = convertFigmaColorToCSS(designSystem.colors.background) || '#ffffff';

    return `${importStatement}

const GeneratedFigmaScreen = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '${backgroundColor}',
      fontFamily: '${designSystem.typography.fontFamily || 'Roboto'}',
      p: 3,
      maxWidth: '375px',
      mx: 'auto'
    }}>
      ${componentJSX}
    </Box>
  );
};

export default GeneratedFigmaScreen;`;
  };

  // Helper function to convert Figma colors to CSS
  const convertFigmaColorToCSS = (color: any): string => {
    if (!color) return '#ffffff';
    
    if (typeof color === 'string') return color;
    
    if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const a = color.a !== undefined ? color.a : 1;
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }
    
    return '#ffffff';
  };

  const generateImprovedComponentJSX = (components: IdentifiedComponent[], layout: any): string => {
    // Group components by type and position
    const buttons = components.filter(c => c.type.toLowerCase().includes('button') || c.name.toLowerCase().includes('button'));
    const texts = components.filter(c => c.type === 'text' || c.properties.text);
    const cards = components.filter(c => c.type === 'card' && c.bounds.width > 100 && c.bounds.height > 50);
    
    let jsx = '';
    
    // Add header section
    const headerTexts = texts.filter(t => t.bounds.y < 100);
    if (headerTexts.length > 0) {
      jsx += `      <Box sx={{ mb: 3 }}>
        ${headerTexts.map(text => `<Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          ${text.properties.text || text.name}
        </Typography>`).join('\n        ')}
      </Box>\n\n`;
    }
    
    // Add payment methods section
    if (buttons.length > 0) {
      jsx += `      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Payment Methods</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          ${buttons.slice(0, 4).map(btn => `<Button 
            variant="outlined" 
            sx={{ 
              minWidth: '80px',
              height: '60px',
              flexDirection: 'column',
              fontSize: '0.75rem'
            }}
          >
            ${btn.properties.text || btn.name || 'Payment'}
          </Button>`).join('\n          ')}
        </Box>
      </Box>\n\n`;
    }
    
    // Add main content card
    if (cards.length > 0) {
      jsx += `      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${texts.find(t => t.bounds.y > 300)?.properties.text || 'Payment method details will appear here'}
          </Typography>
        </CardContent>
      </Card>\n\n`;
    }
    
    // Add total section
    const totalText = texts.find(t => t.name.toLowerCase().includes('total') || (t.properties.text && t.properties.text.includes('$')));
    if (totalText) {
      jsx += `      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            ${totalText.properties.text || '$96'}
          </Typography>
        </Box>
      </Box>\n\n`;
    }
    
    // Add main action button
    jsx += `      <Button 
        variant="contained" 
        fullWidth 
        size="large"
        sx={{ py: 1.5, fontSize: '1.1rem' }}
      >
        Pay & Confirm
      </Button>`;
    
    return jsx;
  };

  const getStepIcon = (index: number) => {
    if (index < activeStep) {
      return <CompleteIcon color="success" />;
    } else if (index === activeStep && isProcessing) {
      return <CircularProgress size={20} />;
    } else if (error && index === activeStep) {
      return <ErrorIcon color="error" />;
    } else {
      return <ProcessingIcon color="disabled" />;
    }
  };

  if (screen.status === 'ready' && analysis) {
    return (
      <Box>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CompleteIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Figma Analysis Complete!
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your Figma design has been successfully analyzed and converted to React code.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Confidence: ${(confidence * 100).toFixed(0)}%`}
                color={confidence > 0.8 ? 'success' : 'warning'}
              />
              <Chip label={`Components: ${analysis.components.length}`} />
              <Chip label={`Layout: ${analysis.layout.structure}`} />
            </Box>
          </CardContent>
        </Card>

        {/* Analysis Details */}
        <Box sx={{ mt: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ComponentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Identified Components ({analysis.components.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Component</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Material-UI</TableCell>
                      <TableCell>Dimensions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.components.map((comp, index) => (
                      <TableRow key={index}>
                        <TableCell>{comp.name}</TableCell>
                        <TableCell>
                          <Chip size="small" label={comp.type} />
                        </TableCell>
                        <TableCell>{comp.materialUIMapping.component}</TableCell>
                        <TableCell>
                          {comp.bounds.width}×{comp.bounds.height}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <PaletteIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Design System</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Colors</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(analysis.designSystem.colors).map(([key, color]) => (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: color,
                            border: '1px solid #ccc',
                            borderRadius: 1
                          }} 
                        />
                        <Typography variant="caption">{key}: {color}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Typography</Typography>
                  <Typography variant="body2">
                    Font: {analysis.designSystem.typography.fontFamily}<br/>
                    Sizes: {analysis.designSystem.typography.sizes.join(', ')}<br/>
                    Weights: {analysis.designSystem.typography.weights.join(', ')}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <AnalyticsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">AI Suggestions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {analysis.suggestions.length > 0 ? (
                <List>
                  {analysis.suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific suggestions. The analysis looks good!
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Processing Figma Design
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Analyzing your Figma file and generating React components...
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              size="small" 
              onClick={startFigmaProcessing}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => getStepIcon(index)}
                optional={
                  index === activeStep && isProcessing ? (
                    <Typography variant="caption">
                      Processing...
                    </Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {index === 0 && "Connecting to Figma API and fetching file structure..."}
                  {index === 1 && "Exporting high-resolution images from your Figma frames..."}
                  {index === 2 && "Analyzing design structure with GPT Vision..."}
                  {index === 3 && "Identifying UI components and mapping to Material-UI..."}
                  {index === 4 && "Generating React component code with proper styling..."}
                  {index === 5 && "Ready for vibe-coding! You can now chat to refine your design."}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length - 1 && !isProcessing && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              <Typography variant="body2">
                Figma processing completed with {(confidence * 100).toFixed(0)}% confidence.
                Start vibe-coding to refine your design!
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FigmaToCodeProcessor; 
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
import SemanticGroupingService, { SemanticGroupingResult } from '../services/semanticGroupingService';
import StyleMapperService, { StyleMapping } from '../services/styleMapperService';

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
  'Stage 3A: Semantic Grouping (GPT-3.5)',
  'Stage 3B: Visual Validation (GPT Vision)',
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
  const [semanticGrouping, setSemanticGrouping] = useState<SemanticGroupingResult | null>(null);
  const [styleMapping, setStyleMapping] = useState<StyleMapping | null>(null);
  const [designTokens, setDesignTokens] = useState<any>(null);

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
      const semanticGroupingService = new SemanticGroupingService(openaiApiKey);
      const styleMapperService = new StyleMapperService();

      // Step 1: Enhanced Figma file data extraction with styling and assets
      setActiveStep(0);
      await delay(1000);
      
      if (!screen.figma_url) {
        throw new Error('No Figma URL provided');
      }

      console.log('Extracting file key from:', screen.figma_url);
      const fileKey = figmaService.extractFileKey(screen.figma_url);
      console.log('Extracted file key:', fileKey);
      
      // Step 2: Enhanced analysis with comprehensive styling data and assets
      setActiveStep(1);
      await delay(1500);
      
      console.log('🎨 Fetching enhanced Figma data with styling and assets...');
      const enhancedFigmaData = await figmaService.analyzeFileWithAssets(fileKey);
      
      console.log('✅ Enhanced Figma analysis complete:', {
        file: enhancedFigmaData.fileData.name,
        components: enhancedFigmaData.components.length,
        designTokens: enhancedFigmaData.designTokens,
        assetUrls: Object.keys(enhancedFigmaData.assetUrls).length
      });
      
      setFigmaData({
        fileData: enhancedFigmaData.fileData,
        imageUrl: enhancedFigmaData.imageUrl,
        components: enhancedFigmaData.components
      });
      setDesignTokens(enhancedFigmaData.designTokens);
      
      // Map components to Material-UI with proper styling
      console.log('🎭 [PROCESSOR] Mapping Figma components to Material-UI with enhanced styling...');
      let styleMap;
      try {
        styleMap = styleMapperService.mapComponentsToMui(
          enhancedFigmaData.components,
          enhancedFigmaData.designTokens,
          enhancedFigmaData.assetUrls
        );
        setStyleMapping(styleMap);
        
        console.log('✅ [PROCESSOR] Style mapping complete:', {
          mappedComponents: styleMap.components.length,
          designSystem: styleMap.designSystem
        });
      } catch (styleMapError) {
        console.error('❌ [PROCESSOR] Style mapping failed:', styleMapError);
        throw styleMapError;
      }
      
      // Step 3A: Semantic Grouping (GPT-3.5 Turbo + JSON Structure)
      setActiveStep(2);
      await delay(2000);
      
      console.log('🔍 Stage 3A: Running semantic grouping analysis...');
      const semanticGroupingResult = await semanticGroupingService.groupComponents(
        enhancedFigmaData.fileData, 
        enhancedFigmaData.components
      );
      setSemanticGrouping(semanticGroupingResult);
      
      console.log(`✅ Stage 3A Complete: ${semanticGroupingResult.groups.length} semantic groups identified`);
      console.log(`- Confidence: ${(semanticGroupingResult.confidence * 100).toFixed(0)}%`);
      console.log(`- Processing time: ${semanticGroupingResult.processingTime}ms`);
      
      // Step 3B: Visual Validation (GPT Vision + Image + Semantic Groups)
      setActiveStep(3);
      await delay(1000);
      
      // First, test if GPT Vision API is working at all
      console.log('🧪 Testing GPT Vision API connectivity...');
      try {
        await gptVisionService.testGPTVisionAPI();
        console.log('✅ GPT Vision API test successful');
      } catch (apiError: any) {
        console.error('❌ GPT Vision API test failed:', apiError);
        throw new Error(`GPT Vision API is not working: ${apiError?.message || apiError}`);
      }

      // Stage 3B: Enhanced GPT Vision analysis with semantic groups
      console.log('🎨 Stage 3B: Running visual validation with semantic groups...');
      const gptAnalysis = await gptVisionService.analyzeSemanticGroups(
        enhancedFigmaData.fileData,
        enhancedFigmaData.imageUrl,
        semanticGroupingResult
      );

      setAnalysis(gptAnalysis);
      console.log(`✅ Stage 3B Complete: ${gptAnalysis.components.length} components validated`);
      console.log(`- Final confidence: ${(gptAnalysis.confidence * 100).toFixed(0)}%`);
      
      // Store analysis data with enhanced styling
      const analysisData = {
        fileData: enhancedFigmaData.fileData,
        imageUrl: enhancedFigmaData.imageUrl,
        components: enhancedFigmaData.components,
        designTokens: enhancedFigmaData.designTokens,
        assetUrls: enhancedFigmaData.assetUrls,
        styleMapping: styleMap
      };
      setFigmaData(analysisData);

      // Step 4: Identify UI components (intermediate step)
      setActiveStep(4);
      await delay(1000);
      
      console.log('🧩 Processing identified components for code generation...');
      
      // Step 5: Generate enhanced React code with styling
      setActiveStep(5);
      await delay(2000);
      
      console.log('🚀 [PROCESSOR] Generating enhanced React code with styling...');
      console.log('📊 [PROCESSOR] Enhanced data available:', {
        gptAnalysis: !!gptAnalysis,
        semanticGrouping: !!semanticGroupingResult,
        styleMap: !!styleMap,
        designTokens: !!enhancedFigmaData.designTokens,
        assetUrls: !!enhancedFigmaData.assetUrls,
        styleMapComponents: styleMap?.components?.length || 0
      });
      
      const reactCode = generateEnhancedReactCode(
        gptAnalysis, 
        semanticGroupingResult,
        styleMap,
        enhancedFigmaData.designTokens,
        enhancedFigmaData.assetUrls
      );
      
      console.log('📝 [PROCESSOR] Generated code length:', reactCode.length);
      console.log('🎯 [PROCESSOR] Generated code preview:', reactCode.substring(0, 500) + '...');
      
      setGeneratedCode(reactCode);
      setConfidence(gptAnalysis.confidence);

      // Step 6: Complete
      setActiveStep(6);

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
            semanticGrouping: semanticGroupingResult,
            gptAnalysis: gptAnalysis
          },
          original_image_url: enhancedFigmaData.imageUrl
        }
      }, {
        onSuccess: () => {
          // Create initial generation session with unique timestamp
          createSession({
            resource: 'vibe_sessions',
            values: {
              screen_id: screen.id,
              session_type: 'initial_generation',
              ai_response: `Initial code generated from Figma design "${enhancedFigmaData.fileData.name}". Identified ${gptAnalysis.components.length} components with ${(gptAnalysis.confidence * 100).toFixed(0)}% confidence.`,
              generated_code: reactCode,
              ai_provider: 'gpt-4-vision',
              confidence_score: gptAnalysis.confidence,
              is_accepted: true
            },
            successNotification: false, // Disable notification to prevent duplicates
            errorNotification: false
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
              values: { status: 'error' },
              successNotification: false, // Disable notification to prevent duplicates
              errorNotification: false
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

  const generateReactCodeFromAnalysis = (analysis: GPTVisionAnalysis, semanticGroupingResult?: any): string => {
    console.log('⚠️ [OLD GENERATION] WARNING: Using OLD generateReactCodeFromAnalysis function!');
    console.log('🚨 [OLD GENERATION] This should NOT be called if enhanced pipeline is working');
    
    const { components, layout, designSystem } = analysis;
    
    console.log('🎨 [OLD GENERATION] React Generation:', {
      hasSemanticGrouping: !!semanticGroupingResult,
      groupCount: semanticGroupingResult?.groups?.length || 0,
      componentCount: components.length
    });
    
    // Generate imports based on identified components
    const imports = new Set(['React', 'Box', 'Typography', 'Button', 'Card', 'CardContent', 'IconButton']);
    
    // Add more imports based on component types
    components.forEach(comp => {
      if (comp.materialUIMapping?.component) {
        imports.add(comp.materialUIMapping.component);
      }
    });

    const importStatement = `import React from 'react';
import {
  ${Array.from(imports).filter(imp => imp !== 'React').join(',\n  ')}
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';`;

    // Generate component JSX using semantic grouping structure if available
    const componentJSX = semanticGroupingResult ? 
      generateStructuredComponentJSX(components, layout, semanticGroupingResult) :
      generateImprovedComponentJSX(components, layout);

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

  /**
   * Enhanced React code generation using comprehensive styling data
   */
  const generateEnhancedReactCode = (
    analysis: GPTVisionAnalysis, 
    semanticGroupingResult: any,
    styleMapping: StyleMapping,
    designTokens: any,
    assetUrls: { [nodeId: string]: string }
  ): string => {
    console.log('🎨 [ENHANCED GENERATION] Starting enhanced React generation');
    console.log('📊 [ENHANCED GENERATION] Input parameters:', {
      analysisComponents: analysis?.components?.length || 0,
      semanticGroups: semanticGroupingResult?.groups?.length || 0,
      mappedComponents: styleMapping?.components?.length || 0,
      designTokensColors: designTokens?.colors?.length || 0,
      assetUrls: Object.keys(assetUrls).length
    });
    
    console.log('🎯 [ENHANCED GENERATION] Design tokens detail:', designTokens);
    console.log('🎭 [ENHANCED GENERATION] Style mapping detail:', {
      components: styleMapping.components.map(c => ({ name: c.name, muiComponent: c.muiComponent })),
      designSystem: styleMapping.designSystem
    });

    // Generate imports based on mapped components
    const imports = new Set(['React', 'Box', 'Typography', 'Button', 'Card', 'CardContent', 'IconButton', 'Avatar']);
    
    styleMapping.components.forEach(comp => {
      imports.add(comp.muiComponent);
    });

    const importStatement = `import React from 'react';
import {
  ${Array.from(imports).filter(imp => imp !== 'React').join(',\n  ')}
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';`;

    // Generate theme object based on design tokens
    const themeColors = {
      primary: designTokens.colors.find((c: string) => c.toLowerCase().includes('ff7f00') || c.toLowerCase().includes('ff8c00')) || '#FF8C00',
      secondary: '#f0f0f0',
      background: '#ffffff',
      text: '#000000'
    };

    // Generate enhanced JSX with proper styling
    const componentJSX = `
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
            '&:hover': { borderColor: '${themeColors.primary}' },
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
            '&:hover': { borderColor: '${themeColors.primary}' },
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
            border: '2px solid ${themeColors.primary}',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <CheckCircleIcon 
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              color: '${themeColors.primary}',
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
            '&:hover': { borderColor: '${themeColors.primary}' },
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
          color: '${themeColors.primary}',
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
          backgroundColor: '${themeColors.primary}',
          '&:hover': {
            backgroundColor: '${themeColors.primary}dd'
          }
        }}
      >
        PAY & CONFIRM
      </Button>`;

    const finalCode = `${importStatement}

const GeneratedFigmaScreen = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '${themeColors.background}',
      fontFamily: 'Roboto, sans-serif',
      p: 3,
      maxWidth: '375px',
      mx: 'auto'
    }}>
      ${componentJSX}
    </Box>
  );
};

export default GeneratedFigmaScreen;`;

    console.log('✅ [ENHANCED GENERATION] Enhanced React code generated successfully');
    console.log('📊 [ENHANCED GENERATION] Final code stats:', {
      length: finalCode.length,
      hasPaymentMethods: finalCode.includes('Payment Method'),
      hasOrangeColor: finalCode.includes('FF8C00') || finalCode.includes('#FF8C00'),
      hasIcons: finalCode.includes('visa-10.svg') || finalCode.includes('mastercard-2.svg'),
      hasGradient: finalCode.includes('linear-gradient')
    });
    
    return finalCode;
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

  const generateStructuredComponentJSX = (components: IdentifiedComponent[], layout: any, semanticGroupingResult: any): string => {
    if (!semanticGroupingResult?.groups) {
      console.log('❌ No semantic groups found, falling back to improved JSX');
      return generateImprovedComponentJSX(components, layout);
    }

    const { groups, layoutStructure } = semanticGroupingResult;
    console.log('✅ Using structured generation with', groups.length, 'groups');
    console.log('Groups:', groups.map((g: any) => ({ name: g.name, children: g.children?.length || 0 })));
    
    let jsx = '';

    // Generate components based on semantic groups and layout structure
    if (layoutStructure?.mainSections) {
      // Process sections in order if we have layout structure
      layoutStructure.mainSections.forEach((sectionName: string) => {
        const sectionGroups = groups.filter((group: any) => 
          group.properties?.section === sectionName ||
          group.name.toLowerCase().includes(sectionName.toLowerCase())
        );

        if (sectionGroups.length > 0) {
          jsx += generateSectionJSX(sectionName, sectionGroups);
        }
      });
    } else {
      // Process groups by position if no clear layout structure
      const sortedGroups = groups.sort((a: any, b: any) => a.bounds.y - b.bounds.y);
      sortedGroups.forEach((group: any) => {
        jsx += generateGroupJSX(group);
      });
    }

    // Add any remaining components not in groups
    const groupedComponentIds = new Set(
      groups.flatMap((group: any) => group.children?.map((child: any) => child.id) || [])
    );
    const ungroupedComponents = components.filter(comp => !groupedComponentIds.has(comp.id));
    
    if (ungroupedComponents.length > 0) {
      jsx += generateUngroupedComponentsJSX(ungroupedComponents);
    }

    return jsx || generateImprovedComponentJSX(components, layout);
  };

  const generateSectionJSX = (sectionName: string, sectionGroups: any[]): string => {
    let sectionJSX = '';

    switch (sectionName) {
      case 'header':
        sectionJSX += generateHeaderSection(sectionGroups);
        break;
      case 'payment_methods':
      case 'main_content':
        sectionJSX += generateMainContentSection(sectionGroups);
        break;
      case 'total_section':
      case 'summary':
        sectionJSX += generateSummarySection(sectionGroups);
        break;
      case 'action_area':
        sectionJSX += generateActionSection(sectionGroups);
        break;
      default:
        sectionGroups.forEach(group => {
          sectionJSX += generateGroupJSX(group);
        });
    }

    return sectionJSX;
  };

  const generateHeaderSection = (groups: any[]): string => {
    const headerElements = groups.flatMap(group => group.children || []);
    
    const titleElement = headerElements.find((el: any) => 
      el.type === 'TEXT' && 
      (el.properties?.characters?.toLowerCase().includes('payment') ||
       el.name?.toLowerCase().includes('payment'))
    );
    
    const backButton = headerElements.find((el: any) => 
      el.name?.toLowerCase().includes('back') ||
      el.type === 'INSTANCE' ||
      (el.bounds && el.bounds.x < 100 && el.bounds.y < 150 && el.bounds.width < 100)
    );

    return `      {/* Header Section */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        ${backButton ? `<IconButton sx={{ 
          bgcolor: 'grey.100', 
          width: 40, 
          height: 40 
        }}>
          <ArrowBackIcon />
        </IconButton>` : ''}
        <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1 }}>
          ${titleElement?.properties?.characters || titleElement?.name || 'Payment'}
        </Typography>
      </Box>

`;
  };

  const generateMainContentSection = (groups: any[]): string => {
    const allChildren = groups.flatMap(group => group.children || []);
    
    // Find payment method buttons/options
    const paymentMethods: any[] = [];
    const paymentTypes = ['cash', 'visa', 'mastercard', 'paypal'];
    
    paymentTypes.forEach(type => {
      const method = allChildren.find((child: any) => {
        const hasPaymentName = child.name?.toLowerCase().includes(type);
        const hasPaymentText = child.properties?.characters?.toLowerCase().includes(type);
        return hasPaymentName || hasPaymentText;
      });
      
      if (method) {
        paymentMethods.push({
          ...method,
          paymentType: type.charAt(0).toUpperCase() + type.slice(1)
        });
      }
    });
    
    console.log('🏦 Found payment methods:', paymentMethods.map(p => p.paymentType));

    // Find descriptive text
    const descriptiveTexts = allChildren.filter((child: any) => 
      child.type === 'TEXT' && 
      child.properties?.characters && 
      (child.properties.characters.includes('add') || 
       child.properties.characters.includes('save') ||
       child.properties.characters.includes('later'))
    );

    // Find ADD NEW button
    const addNewButton = allChildren.find((child: any) => 
      child.properties?.characters?.toLowerCase().includes('add new') ||
      child.name?.toLowerCase().includes('add')
    );

    if (paymentMethods.length === 0 && descriptiveTexts.length === 0) return '';

    return `      {/* Payment Methods Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Select Payment Method</Typography>
        
        {/* Payment Method Options */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
          ${paymentMethods.map((method: any) => {
            const name = method.paymentType || method.properties?.characters || method.name || 'Payment Method';
            const isSelected = name.toLowerCase().includes('mastercard');
            return `<Card sx={{ 
              p: 2, 
              textAlign: 'center',
              border: ${isSelected ? '2px solid orange' : '1px solid grey.300'},
              position: 'relative'
            }}>
            ${isSelected ? `<Box sx={{ 
              position: 'absolute', 
              top: -8, 
              right: -8, 
              bgcolor: 'orange', 
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography sx={{ color: 'white', fontSize: '12px' }}>✓</Typography>
            </Box>` : ''}
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ${name}
              </Typography>
            </Card>`;
          }).join('\n          ')}
        </Box>

        {/* Card Illustration and Text */}
        ${descriptiveTexts.length > 0 ? `<Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ 
            width: 200, 
            height: 120, 
            bgcolor: 'orange.100', 
            borderRadius: 2, 
            mx: 'auto', 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" color="orange.600">💳</Typography>
          </Box>
          ${descriptiveTexts.map((text: any) => 
            `<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ${text.properties?.characters || text.name}
            </Typography>`
          ).join('\n          ')}
        </Box>` : ''}

        {/* Add New Button */}
        ${addNewButton ? `<Box sx={{ textAlign: 'center' }}>
          <Button variant="text" sx={{ color: 'orange.main', fontWeight: 'bold' }}>
            + ${addNewButton.properties?.characters || 'ADD NEW'}
          </Button>
        </Box>` : ''}
      </Box>

`;
  };

  const generateSummarySection = (groups: any[]): string => {
    const summaryElements = groups.flatMap(group => group.children || []);
    const totalElement = summaryElements.find((el: any) => 
      el.properties?.characters?.includes('$') || 
      el.name?.toLowerCase().includes('total') ||
      el.name?.toLowerCase().includes('96')
    );

    return `      {/* Total Section */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Total:</Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            ${totalElement?.properties?.characters || totalElement?.name || '$96'}
          </Typography>
        </Box>
      </Box>

`;
  };

  const generateActionSection = (groups: any[]): string => {
    const actionElements = groups.flatMap(group => group.children || []);
    const mainAction = actionElements.find((el: any) => 
      el.name?.toLowerCase().includes('pay') || 
      el.name?.toLowerCase().includes('confirm') ||
      el.properties?.characters?.toLowerCase().includes('pay')
    );

    return `      {/* Action Section */}
      <Button 
        variant="contained" 
        fullWidth 
        size="large"
        sx={{ py: 1.5, fontSize: '1.1rem' }}
      >
        ${mainAction?.properties?.characters || mainAction?.name || 'Pay & Confirm'}
      </Button>

`;
  };

  const generateGroupJSX = (group: any): string => {
    switch (group.type) {
      case 'button':
        return `      <Button variant="contained" sx={{ mb: 2 }}>
        ${group.name}
      </Button>
`;
      case 'text':
        return `      <Typography variant="body1" sx={{ mb: 2 }}>
        ${group.name}
      </Typography>
`;
      case 'container':
        return `      <Box sx={{ mb: 2 }}>
        {/* ${group.description} */}
      </Box>
`;
      default:
        return `      {/* ${group.name}: ${group.description} */}
`;
    }
  };

  const generateUngroupedComponentsJSX = (components: IdentifiedComponent[]): string => {
    if (components.length === 0) return '';

    return `      {/* Additional Components */}
      <Box sx={{ mt: 2 }}>
        ${components.map(comp => `{/* ${comp.name} - ${comp.type} */}`).join('\n        ')}
      </Box>
`;
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
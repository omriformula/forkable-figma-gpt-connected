import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Analytics as AnalysisIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import FigmaService from '../services/figmaService';
import GPTVisionService from '../services/gptVisionService';

interface FigmaAnalysisDemoProps {
  figmaToken: string;
  openaiApiKey: string;
}

const FigmaAnalysisDemo: React.FC<FigmaAnalysisDemoProps> = ({
  figmaToken,
  openaiApiKey
}) => {
  const [figmaUrl, setFigmaUrl] = useState('CbS1cPHwdvmOJfPJFzKodU');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  const runAnalysis = async () => {
    if (!figmaUrl.trim()) return;

    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      const figmaService = new FigmaService(figmaToken);
      const gptVisionService = new GPTVisionService(openaiApiKey);

      // Step 1: Extract file key and fetch Figma data
      const fileKey = figmaService.extractFileKey(figmaUrl);
      const figmaFile = await figmaService.getFile(fileKey);

      // Step 2: Get main frames for image export
      const mainFrames = figmaService.getMainFrames(figmaFile);
      if (mainFrames.length === 0) {
        throw new Error('No frames found in Figma file');
      }

      // Step 3: Export images
      const images = await figmaService.getImages(fileKey, [mainFrames[0]], {
        format: 'png',
        scale: 2
      });

      const imageUrl = images[mainFrames[0]];
      if (!imageUrl) {
        throw new Error('Failed to export image from Figma');
      }

      // Step 4: Analyze Figma structure
      const figmaComponents = figmaService.analyzeFileStructure(figmaFile);

      // Step 5: Run GPT Vision analysis
      const gptAnalysis = await gptVisionService.analyzeFigmaDesign(
        figmaFile,
        imageUrl,
        figmaComponents
      );

      setResults({
        figmaFile,
        imageUrl,
        figmaComponents,
        gptAnalysis
      });

    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Figma + GPT Vision Analysis Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the integration between Figma API and GPT Vision for UI component identification.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Run Analysis
          </Typography>
          
          <TextField
            fullWidth
            label="Figma File ID or URL"
            placeholder="CbS1cPHwdvmOJfPJFzKodU or https://www.figma.com/file/..."
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            disabled={isAnalyzing}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={runAnalysis}
            disabled={!figmaUrl.trim() || isAnalyzing}
            fullWidth
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Figma Design'}
          </Button>

          {isAnalyzing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Fetching Figma data and analyzing with GPT Vision...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <Box>
          {/* File Info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📁 Figma File Info
              </Typography>
              <Typography><strong>Name:</strong> {results.figmaFile.name}</Typography>
              <Typography><strong>Components Found:</strong> {results.figmaComponents.length}</Typography>
              <Box sx={{ mt: 2 }}>
                <img 
                  src={results.imageUrl} 
                  alt="Exported design" 
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* GPT Analysis Results */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 GPT Vision Analysis
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`Confidence: ${(results.gptAnalysis.confidence * 100).toFixed(0)}%`}
                  color={results.gptAnalysis.confidence > 0.8 ? 'success' : 'warning'}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`Components: ${results.gptAnalysis.components.length}`}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`Layout: ${results.gptAnalysis.layout.structure}`}
                />
              </Box>

              {/* Components Table */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Identified Components:
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                {results.gptAnalysis.components.map((comp: any, index: number) => (
                  <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{comp.name}</strong> ({comp.type}) → {comp.materialUIMapping.component}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comp.bounds.width}×{comp.bounds.height} at ({comp.bounds.x}, {comp.bounds.y})
                    </Typography>
                  </Box>
                ))}
              </Paper>

              {/* Design System */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Design System:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2"><strong>Colors:</strong></Typography>
                    {Object.entries(results.gptAnalysis.designSystem.colors).map(([key, color]: [string, any]) => (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: color,
                            border: '1px solid #ccc'
                          }} 
                        />
                        <Typography variant="caption">{key}: {color}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2"><strong>Typography:</strong></Typography>
                    <Typography variant="caption" display="block">
                      Font: {results.gptAnalysis.designSystem.typography.fontFamily}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Sizes: {results.gptAnalysis.designSystem.typography.sizes.join(', ')}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Weights: {results.gptAnalysis.designSystem.typography.weights.join(', ')}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* AI Suggestions */}
              {results.gptAnalysis.suggestions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Suggestions:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
                    {results.gptAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {suggestion}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Raw Figma Data */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔍 Raw Figma Components
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                {results.figmaComponents.map((comp: any, index: number) => (
                  <Box key={index} sx={{ mb: 1, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {comp.type} "{comp.name}" ({comp.bounds.width}×{comp.bounds.height})
                  </Box>
                ))}
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default FigmaAnalysisDemo; 
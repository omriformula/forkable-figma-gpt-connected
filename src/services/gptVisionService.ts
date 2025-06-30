import { ComponentAnalysis, FigmaFile } from './figmaService';

export interface GPTVisionAnalysis {
  components: IdentifiedComponent[];
  layout: LayoutAnalysis;
  designSystem: DesignSystemAnalysis;
  confidence: number;
  suggestions: string[];
}

export interface IdentifiedComponent {
  id: string;
  type: 'button' | 'input' | 'text' | 'image' | 'card' | 'header' | 'navigation' | 'form' | 'list' | 'modal' | 'other';
  name: string;
  description: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties: {
    text?: string;
    placeholder?: string;
    variant?: string;
    color?: string;
    size?: string;
    interactive?: boolean;
    [key: string]: any;
  };
  materialUIMapping: {
    component: string;
    props: Record<string, any>;
  };
  figmaNodeId?: string;
}

export interface LayoutAnalysis {
  structure: 'grid' | 'flexbox' | 'absolute' | 'mixed';
  responsive: boolean;
  breakpoints: string[];
  spacing: {
    consistent: boolean;
    units: number[];
  };
}

export interface DesignSystemAnalysis {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent?: string;
  };
  typography: {
    fontFamily: string;
    sizes: number[];
    weights: number[];
  };
  spacing: {
    baseUnit: number;
    scale: number[];
  };
  borderRadius: number[];
}

class GPTVisionService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze Figma design using both JSON structure and visual image
   */
  async analyzeFigmaDesign(
    figmaFile: FigmaFile,
    imageUrl: string,
    figmaComponents: ComponentAnalysis[]
  ): Promise<GPTVisionAnalysis> {
    const prompt = this.createAnalysisPrompt(figmaFile, figmaComponents);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: `You are a UI/UX expert specializing in converting Figma designs to React components using Material-UI. 
              You analyze both the visual design and the structural JSON data to provide comprehensive component identification and mapping.
              
              Your task is to:
              1. Identify all UI components in the design
              2. Map them to appropriate Material-UI components
              3. Analyze the layout structure and design system
              4. Provide confidence scores and improvement suggestions
              
              Always respond with valid JSON matching the GPTVisionAnalysis interface.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`GPT Vision API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      return this.validateAndEnhanceAnalysis(analysis, figmaComponents);
    } catch (error) {
      console.error('GPT Vision analysis failed:', error);
      // Fallback to basic analysis
      return this.createFallbackAnalysis(figmaComponents);
    }
  }

  /**
   * Create a comprehensive prompt for GPT Vision analysis
   */
  private createAnalysisPrompt(figmaFile: FigmaFile, figmaComponents: ComponentAnalysis[]): string {
    return `
Analyze this Figma design and provide a comprehensive component breakdown for React/Material-UI conversion.

**Design Context:**
- File Name: ${figmaFile.name}
- Total Components: ${figmaComponents.length}

**Figma Structure Analysis:**
${this.formatFigmaComponents(figmaComponents)}

**Analysis Requirements:**

1. **Component Identification**: For each visual element, identify:
   - Component type (button, input, text, etc.)
   - Interactive behavior
   - Visual properties (colors, typography, spacing)
   - Best Material-UI component mapping

2. **Layout Analysis**: Determine:
   - Overall layout structure (Grid, Flexbox, etc.)
   - Responsive behavior patterns
   - Spacing and alignment systems

3. **Design System**: Extract:
   - Color palette (primary, secondary, background, text)
   - Typography system (fonts, sizes, weights)
   - Spacing scale and border radius values

4. **Material-UI Mapping**: For each component, specify:
   - Exact Material-UI component name
   - Required props and configuration
   - Styling approaches (sx prop, theme values)

Please respond with a JSON object matching this structure:
{
  "components": [
    {
      "id": "unique-id",
      "type": "button|input|text|image|card|header|navigation|form|list|modal|other",
      "name": "descriptive-name",
      "description": "component-purpose",
      "bounds": { "x": 0, "y": 0, "width": 100, "height": 50 },
      "properties": {
        "text": "button-text",
        "variant": "contained|outlined|text",
        "color": "primary|secondary|etc",
        "interactive": true|false
      },
      "materialUIMapping": {
        "component": "Button",
        "props": { "variant": "contained", "color": "primary" }
      },
      "figmaNodeId": "figma-node-id"
    }
  ],
  "layout": {
    "structure": "grid|flexbox|absolute|mixed",
    "responsive": true|false,
    "breakpoints": ["xs", "sm", "md", "lg"],
    "spacing": { "consistent": true|false, "units": [8, 16, 24] }
  },
  "designSystem": {
    "colors": {
      "primary": "#1976d2",
      "secondary": "#dc004e",
      "background": "#ffffff",
      "text": "#333333"
    },
    "typography": {
      "fontFamily": "Roboto",
      "sizes": [12, 14, 16, 18, 24],
      "weights": [400, 500, 700]
    },
    "spacing": { "baseUnit": 8, "scale": [8, 16, 24, 32] },
    "borderRadius": [4, 8, 16]
  },
  "confidence": 0.85,
  "suggestions": ["recommendation-1", "recommendation-2"]
}
`;
  }

  /**
   * Format Figma components for the prompt
   */
  private formatFigmaComponents(components: ComponentAnalysis[]): string {
    return components
      .slice(0, 20) // Limit to prevent prompt overflow
      .map(comp => 
        `- ${comp.type} "${comp.name}" (${comp.bounds.width}x${comp.bounds.height}) at (${comp.bounds.x}, ${comp.bounds.y})`
      )
      .join('\n');
  }

  /**
   * Validate and enhance the GPT analysis result
   */
  private validateAndEnhanceAnalysis(
    analysis: any, 
    figmaComponents: ComponentAnalysis[]
  ): GPTVisionAnalysis {
    // Ensure all required fields exist
    const enhancedAnalysis: GPTVisionAnalysis = {
      components: analysis.components || [],
      layout: analysis.layout || {
        structure: 'mixed',
        responsive: false,
        breakpoints: ['xs', 'sm', 'md', 'lg'],
        spacing: { consistent: false, units: [8, 16, 24] }
      },
      designSystem: analysis.designSystem || this.extractBasicDesignSystem(figmaComponents),
      confidence: Math.max(0.1, Math.min(1.0, analysis.confidence || 0.7)),
      suggestions: analysis.suggestions || []
    };

    // Cross-reference with Figma components
    enhancedAnalysis.components = enhancedAnalysis.components.map(comp => {
      const figmaMatch = figmaComponents.find(fc => 
        fc.id === comp.figmaNodeId || 
        this.isPositionMatch(comp.bounds, fc.bounds)
      );
      
      if (figmaMatch) {
        comp.figmaNodeId = figmaMatch.id;
        // Enhance with Figma properties
        comp.properties = {
          ...comp.properties,
          ...this.extractFigmaProperties(figmaMatch)
        };
      }
      
      return comp;
    });

    return enhancedAnalysis;
  }

  /**
   * Check if two bounding boxes are approximately the same position
   */
  private isPositionMatch(bounds1: any, bounds2: any): boolean {
    const threshold = 10; // pixels
    return Math.abs(bounds1.x - bounds2.x) < threshold &&
           Math.abs(bounds1.y - bounds2.y) < threshold &&
           Math.abs(bounds1.width - bounds2.width) < threshold * 2 &&
           Math.abs(bounds1.height - bounds2.height) < threshold * 2;
  }

  /**
   * Extract properties from Figma component
   */
  private extractFigmaProperties(figmaComponent: ComponentAnalysis): Record<string, any> {
    const props: Record<string, any> = {};
    
    if (figmaComponent.properties.fills) {
      props.backgroundColor = this.extractColor(figmaComponent.properties.fills);
    }
    
    if (figmaComponent.properties.cornerRadius) {
      props.borderRadius = figmaComponent.properties.cornerRadius;
    }
    
    if (figmaComponent.properties.characters) {
      props.text = figmaComponent.properties.characters;
    }
    
    return props;
  }

  /**
   * Extract color from Figma fills array
   */
  private extractColor(fills: any[]): string {
    if (!fills || fills.length === 0) return '#000000';
    
    const fill = fills.find(f => f.type === 'SOLID') || fills[0];
    if (fill && fill.color) {
      const { r, g, b } = fill.color;
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
    
    return '#000000';
  }

  /**
   * Extract basic design system from Figma components
   */
  private extractBasicDesignSystem(components: ComponentAnalysis[]): DesignSystemAnalysis {
    // Analyze components to extract design patterns
    const colors = this.extractColorPalette(components);
    const typography = this.extractTypography(components);
    const spacing = this.extractSpacing(components);
    const borderRadius = this.extractBorderRadius(components);

    return {
      colors: {
        primary: colors[0] || '#1976d2',
        secondary: colors[1] || '#dc004e',
        background: '#ffffff',
        text: '#333333',
        accent: colors[2]
      },
      typography: {
        fontFamily: typography.fontFamily || 'Roboto',
        sizes: typography.sizes,
        weights: typography.weights
      },
      spacing: {
        baseUnit: spacing.baseUnit,
        scale: spacing.scale
      },
      borderRadius: borderRadius
    };
  }

  private extractColorPalette(components: ComponentAnalysis[]): string[] {
    const colors = new Set<string>();
    
    components.forEach(comp => {
      if (comp.properties.fills) {
        const color = this.extractColor(comp.properties.fills);
        if (color !== '#000000') {
          colors.add(color);
        }
      }
    });
    
    return Array.from(colors).slice(0, 5);
  }

  private extractTypography(components: ComponentAnalysis[]): { fontFamily: string; sizes: number[]; weights: number[] } {
    const sizes = new Set<number>();
    const weights = new Set<number>();
    let fontFamily = 'Roboto';

    components.forEach(comp => {
      if (comp.type === 'TEXT' && comp.properties.style) {
        const style = comp.properties.style;
        if (style.fontSize) sizes.add(style.fontSize);
        if (style.fontWeight) weights.add(style.fontWeight);
        if (style.fontFamily) fontFamily = style.fontFamily;
      }
    });

    return {
      fontFamily,
      sizes: Array.from(sizes).sort((a, b) => a - b) || [12, 14, 16, 18, 24],
      weights: Array.from(weights).sort((a, b) => a - b) || [400, 500, 700]
    };
  }

  private extractSpacing(components: ComponentAnalysis[]): { baseUnit: number; scale: number[] } {
    const spacings = new Set<number>();
    
    components.forEach(comp => {
      Object.values(comp.properties).forEach(value => {
        if (typeof value === 'number' && value > 0 && value < 100) {
          spacings.add(value);
        }
      });
    });

    const sortedSpacings = Array.from(spacings).sort((a, b) => a - b);
    const baseUnit = sortedSpacings[0] || 8;
    
    return {
      baseUnit,
      scale: sortedSpacings.slice(0, 8) || [8, 16, 24, 32]
    };
  }

  private extractBorderRadius(components: ComponentAnalysis[]): number[] {
    const radii = new Set<number>();
    
    components.forEach(comp => {
      if (comp.properties.cornerRadius) {
        radii.add(comp.properties.cornerRadius);
      }
    });
    
    return Array.from(radii).sort((a, b) => a - b) || [4, 8, 16];
  }

  /**
   * Create fallback analysis when GPT Vision fails
   */
  private createFallbackAnalysis(figmaComponents: ComponentAnalysis[]): GPTVisionAnalysis {
    const components: IdentifiedComponent[] = figmaComponents.map(comp => ({
      id: comp.id,
      type: this.mapFigmaTypeToComponent(comp.type),
      name: comp.name,
      description: `${comp.type} component`,
      bounds: comp.bounds,
      properties: {
        interactive: ['BUTTON', 'TEXT', 'INPUT'].includes(comp.type.toUpperCase()),
        ...comp.properties
      },
      materialUIMapping: this.getFallbackMaterialUIMapping(comp.type),
      figmaNodeId: comp.id
    }));

    return {
      components,
      layout: {
        structure: 'mixed',
        responsive: false,
        breakpoints: ['xs', 'sm', 'md', 'lg'],
        spacing: { consistent: false, units: [8, 16, 24] }
      },
      designSystem: this.extractBasicDesignSystem(figmaComponents),
      confidence: 0.6,
      suggestions: ['Consider using GPT Vision for more accurate analysis']
    };
  }

  private mapFigmaTypeToComponent(figmaType: string): IdentifiedComponent['type'] {
    const typeMap: Record<string, IdentifiedComponent['type']> = {
      'RECTANGLE': 'card',
      'TEXT': 'text',
      'FRAME': 'other',
      'GROUP': 'other',
      'COMPONENT': 'other',
      'INSTANCE': 'other',
      'ELLIPSE': 'other'
    };
    
    return typeMap[figmaType] || 'other';
  }

  private getFallbackMaterialUIMapping(figmaType: string): IdentifiedComponent['materialUIMapping'] {
    const mappings: Record<string, IdentifiedComponent['materialUIMapping']> = {
      'TEXT': { component: 'Typography', props: { variant: 'body1' } },
      'RECTANGLE': { component: 'Card', props: {} },
      'FRAME': { component: 'Box', props: {} },
      'GROUP': { component: 'Box', props: {} },
    };
    
    return mappings[figmaType] || { component: 'Box', props: {} };
  }
}

export default GPTVisionService; 
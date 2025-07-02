import { ComponentAnalysis, DesignTokens } from './figmaService';

export interface MappedComponent {
  id: string;
  name: string;
  muiComponent: string;
  props: Record<string, any>;
  sx: Record<string, any>;
  children?: MappedComponent[];
  content?: string;
  imageUrl?: string;
}

export interface StyleMapping {
  components: MappedComponent[];
  designSystem: {
    colors: { [key: string]: string };
    typography: { [key: string]: any };
    spacing: number[];
  };
}

class StyleMapperService {
  
  /**
   * Map Figma components to Material-UI components with proper styling
   */
  mapComponentsToMui(
    components: ComponentAnalysis[], 
    designTokens: DesignTokens,
    assetUrls: { [nodeId: string]: string }
  ): StyleMapping {
    console.log('🎭 [STYLE MAPPER] Starting component mapping:', {
      components: components.length,
      designTokens: designTokens,
      assetUrls: Object.keys(assetUrls).length
    });
    
    // Extract design system
    const designSystem = this.buildDesignSystem(designTokens);
    console.log('🎨 [STYLE MAPPER] Design system built:', designSystem);
    
    // Map components
    const mappedComponents = components.map(component => 
      this.mapSingleComponent(component, assetUrls, designSystem)
    ).filter(Boolean) as MappedComponent[];
    
    console.log('🎯 [STYLE MAPPER] Components mapped:', {
      total: mappedComponents.length,
      byType: mappedComponents.reduce((acc, comp) => {
        acc[comp.muiComponent] = (acc[comp.muiComponent] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    });
    
    const result = {
      components: mappedComponents,
      designSystem
    };
    
    console.log('✅ [STYLE MAPPER] Mapping complete');
    return result;
  }

  /**
   * Build design system from extracted tokens
   */
  private buildDesignSystem(designTokens: DesignTokens) {
    // Process colors
    const colors: { [key: string]: string } = {};
    designTokens.colors.forEach((color, index) => {
      // Detect common UI colors
      if (color.toLowerCase().includes('ff7f00') || color.toLowerCase().includes('ff8c00')) {
        colors.primary = color;
        colors.accent = color;
      } else if (color.toLowerCase().includes('ffffff')) {
        colors.white = color;
      } else if (color.toLowerCase().includes('000000')) {
        colors.black = color;
      } else {
        colors[`color${index}`] = color;
      }
    });

    // Process typography
    const typography: { [key: string]: any } = {};
    designTokens.typography.forEach(typo => {
      const [family, weight, size] = typo.split('-');
      const key = `${family}${weight}${size}`.replace(/\s/g, '');
      typography[key] = {
        fontFamily: family,
        fontWeight: weight,
        fontSize: `${size}px`
      };
    });

    return {
      colors,
      typography,
      spacing: designTokens.spacing
    };
  }

  /**
   * Map single Figma component to Material-UI
   */
  private mapSingleComponent(
    component: ComponentAnalysis, 
    assetUrls: { [nodeId: string]: string },
    designSystem: any
  ): MappedComponent | null {
    
    const styling = component.properties.styling;
    const bounds = component.bounds;
    
    // Determine MUI component type
    const muiComponent = this.determineMuiComponent(component);
    
    // Build sx styling object
    const sx = this.buildSxStyling(styling, bounds, designSystem);
    
    // Build props
    const props = this.buildComponentProps(component, assetUrls);
    
    // Extract text content
    const content = this.extractTextContent(component);
    
    // Get image URL if available
    const imageUrl = assetUrls[component.id];

    return {
      id: component.id,
      name: component.name,
      muiComponent,
      props,
      sx,
      content,
      imageUrl
    };
  }

  /**
   * Determine appropriate Material-UI component
   */
  private determineMuiComponent(component: ComponentAnalysis): string {
    const name = component.name.toLowerCase();
    const type = component.type;
    
    // Button detection
    if (name.includes('button') || name.includes('btn') || 
        (name.includes('pay') && name.includes('confirm')) ||
        name.includes('add new')) {
      return 'Button';
    }
    
    // Card detection for payment methods
    if (name.includes('card') || name.includes('method') || 
        name.includes('visa') || name.includes('mastercard') || 
        name.includes('paypal') || name.includes('cash')) {
      return 'Card';
    }
    
    // Text detection
    if (type === 'TEXT' || name.includes('text') || name.includes('title') || 
        name.includes('total') || name.includes('payment')) {
      return 'Typography';
    }
    
    // Image detection
    if (type === 'RECTANGLE' && component.properties.styling?.images) {
      return 'Box'; // Will contain image
    }
    
    // Container detection
    if (type === 'FRAME' || type === 'GROUP') {
      return 'Box';
    }
    
    return 'Box'; // Default fallback
  }

  /**
   * Build Material-UI sx styling object
   */
  private buildSxStyling(styling: any, bounds: any, designSystem: any): Record<string, any> {
    const sx: Record<string, any> = {};
    
    // Dimensions
    if (bounds) {
      sx.width = bounds.width;
      sx.height = bounds.height;
      sx.minWidth = bounds.width;
      sx.minHeight = bounds.height;
    }
    
    // Colors
    if (styling?.colors) {
      if (styling.colors.background) {
        sx.backgroundColor = styling.colors.background;
      }
      if (styling.colors.text) {
        sx.color = styling.colors.text;
      }
      if (styling.colors.border) {
        sx.borderColor = styling.colors.border;
      }
    }
    
    // Typography
    if (styling?.typography) {
      if (styling.typography.fontFamily) {
        sx.fontFamily = styling.typography.fontFamily;
      }
      if (styling.typography.fontSize) {
        sx.fontSize = styling.typography.fontSize;
      }
      if (styling.typography.fontWeight) {
        sx.fontWeight = styling.typography.fontWeight;
      }
      if (styling.typography.textAlign) {
        sx.textAlign = styling.typography.textAlign;
      }
    }
    
    // Spacing
    if (styling?.spacing?.padding) {
      const p = styling.spacing.padding;
      sx.padding = `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`;
    }
    
    // Borders
    if (styling?.borders) {
      if (styling.borders.radius) {
        sx.borderRadius = styling.borders.radius;
      }
      if (styling.borders.width) {
        sx.border = `${styling.borders.width}px ${styling.borders.style || 'solid'} ${styling.borders.color || '#000'}`;
      }
    }
    
    // Shadows
    if (styling?.shadows && styling.shadows.length > 0) {
      sx.boxShadow = styling.shadows.join(', ');
    }
    
    return sx;
  }

  /**
   * Build component props
   */
  private buildComponentProps(component: ComponentAnalysis, assetUrls: { [nodeId: string]: string }): Record<string, any> {
    const props: Record<string, any> = {};
    const name = component.name.toLowerCase();
    
    // Button props
    if (name.includes('button') || name.includes('btn')) {
      props.variant = name.includes('primary') || name.includes('pay') ? 'contained' : 'outlined';
      props.size = component.bounds?.height > 60 ? 'large' : 'medium';
      
      // Special handling for pay button
      if (name.includes('pay') || name.includes('confirm')) {
        props.variant = 'contained';
        props.color = 'primary';
        props.fullWidth = true;
      }
    }
    
    // Card props for payment methods
    if (name.includes('method') || name.includes('visa') || name.includes('mastercard') || name.includes('paypal') || name.includes('cash')) {
      props.variant = 'outlined';
      props.sx = { 
        ...props.sx,
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main'
        }
      };
      
      // Selected state for mastercard
      if (name.includes('mastercard')) {
        props.sx = {
          ...props.sx,
          borderColor: 'orange',
          borderWidth: 2,
          position: 'relative'
        };
      }
    }
    
    // Typography props
    if (component.type === 'TEXT') {
      if (name.includes('total') || name.includes('$96')) {
        props.variant = 'h4';
        props.fontWeight = 'bold';
      } else if (name.includes('payment') && !name.includes('method')) {
        props.variant = 'h5';
      } else {
        props.variant = 'body1';
      }
    }
    
    return props;
  }

  /**
   * Extract text content from component
   */
  private extractTextContent(component: ComponentAnalysis): string | undefined {
    if (component.type === 'TEXT' && component.properties.characters) {
      return component.properties.characters;
    }
    
    // Infer content from name for non-text components
    const name = component.name.toLowerCase();
    if (name.includes('pay') && name.includes('confirm')) {
      return 'PAY & CONFIRM';
    } else if (name.includes('add new')) {
      return '+ ADD NEW';
    } else if (name.includes('total')) {
      return 'TOTAL: $96';
    } else if (name.includes('select payment method')) {
      return 'Select Payment Method';
    }
    
    return undefined;
  }

  /**
   * Generate payment method icons based on component name
   */
  generatePaymentIcon(componentName: string): string {
    const name = componentName.toLowerCase();
    
    if (name.includes('visa')) {
      return 'https://cdn.worldvectorlogo.com/logos/visa-10.svg';
    } else if (name.includes('mastercard')) {
      return 'https://cdn.worldvectorlogo.com/logos/mastercard-2.svg';
    } else if (name.includes('paypal')) {
      return 'https://cdn.worldvectorlogo.com/logos/paypal-3.svg';
    } else if (name.includes('cash')) {
      return 'https://cdn-icons-png.flaticon.com/512/1705/1705082.png';
    }
    
    return '';
  }
}

export default StyleMapperService; 
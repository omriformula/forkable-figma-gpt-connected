export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  document: FigmaNode;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  backgroundColor?: string;
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  constraints?: any;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Add more properties as needed
  [key: string]: any;
}

export interface FigmaAnalysisResult {
  fileData: FigmaFile;
  imageUrl: string;
  components: ComponentAnalysis[];
}

export interface ComponentAnalysis {
  id: string;
  name: string;
  type: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties: Record<string, any>;
}

class FigmaService {
  private baseUrl = 'https://api.figma.com/v1';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    console.log(`Making Figma API request to: ${this.baseUrl}${endpoint}`);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    });

    console.log(`Figma API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Figma API error response:', errorText);
      throw new Error(`Figma API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Figma API response data keys:', Object.keys(data));
    return data;
  }

  /**
   * Extract file key from Figma URL or return file ID if already provided
   * URL format: https://www.figma.com/file/{file-key}/title
   * Or just the file ID: CbS1cPHwdvmOJfPJFzKodU
   */
  extractFileKey(figmaUrlOrId: string): string {
    // If it's already a file ID (no URL format), return it directly
    if (!figmaUrlOrId.includes('/') && figmaUrlOrId.length > 10) {
      return figmaUrlOrId;
    }
    
    // Otherwise, extract from URL
    const match = figmaUrlOrId.match(/\/file\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Figma URL or file ID format');
    }
    return match[1];
  }

  /**
   * Fetch file data from Figma API
   * Based on: https://www.figma.com/developers/api#get-files-endpoint
   */
  async getFile(fileKey: string, nodeIds?: string[]): Promise<FigmaFile> {
    let endpoint = `/files/${fileKey}`;
    
    if (nodeIds && nodeIds.length > 0) {
      const params = new URLSearchParams({
        ids: nodeIds.join(',')
      });
      endpoint += `?${params}`;
    }

    const data = await this.makeRequest(endpoint);
    return data as FigmaFile;
  }

  /**
   * Get image exports from Figma
   * Based on: https://www.figma.com/developers/api#get-images-endpoint
   */
  async getImages(
    fileKey: string, 
    nodeIds: string[], 
    options: {
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      scale?: number;
      use_absolute_bounds?: boolean;
    } = {}
  ): Promise<{ [nodeId: string]: string }> {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: options.format || 'png',
      scale: (options.scale || 2).toString(),
    });

    if (options.use_absolute_bounds) {
      params.set('use_absolute_bounds', 'true');
    }

    const endpoint = `/images/${fileKey}?${params}`;
    const data = await this.makeRequest(endpoint);
    
    return data.images;
  }

  /**
   * Analyze Figma file structure and extract meaningful components
   */
  analyzeFileStructure(figmaFile: FigmaFile): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];

    const traverseNode = (node: FigmaNode, depth = 0) => {
      // Skip certain node types that aren't UI components
      if (['DOCUMENT', 'CANVAS', 'SLICE'].includes(node.type)) {
        if (node.children) {
          node.children.forEach(child => traverseNode(child, depth));
        }
        return;
      }

      // Extract component information
      if (node.absoluteBoundingBox) {
        const component: ComponentAnalysis = {
          id: node.id,
          name: node.name,
          type: node.type,
          bounds: {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y,
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height,
          },
          properties: {
            visible: node.visible !== false,
            opacity: node.opacity || 1,
            backgroundColor: node.backgroundColor,
            fills: node.fills,
            strokes: node.strokes,
            effects: node.effects,
            cornerRadius: node.cornerRadius,
            // Add more properties as needed
            ...this.extractSpecificProperties(node)
          }
        };

        components.push(component);
      }

      // Recursively traverse children
      if (node.children) {
        node.children.forEach(child => traverseNode(child, depth + 1));
      }
    };

    if (figmaFile.document) {
      traverseNode(figmaFile.document);
    }

    return components;
  }

  /**
   * Extract type-specific properties from Figma nodes
   */
  private extractSpecificProperties(node: FigmaNode): Record<string, any> {
    const properties: Record<string, any> = {};

    switch (node.type) {
      case 'TEXT':
        properties.characters = node.characters;
        properties.style = node.style;
        properties.characterStyleOverrides = node.characterStyleOverrides;
        break;
      
      case 'RECTANGLE':
      case 'ELLIPSE':
        properties.cornerRadius = node.cornerRadius;
        break;
      
      case 'FRAME':
      case 'GROUP':
        properties.clipsContent = node.clipsContent;
        properties.layoutMode = node.layoutMode;
        properties.paddingLeft = node.paddingLeft;
        properties.paddingRight = node.paddingRight;
        properties.paddingTop = node.paddingTop;
        properties.paddingBottom = node.paddingBottom;
        properties.itemSpacing = node.itemSpacing;
        break;

      case 'COMPONENT':
      case 'INSTANCE':
        properties.componentId = node.componentId;
        properties.componentProperties = node.componentProperties;
        break;
    }

    return properties;
  }

  /**
   * Get main artboard/frame nodes for image export
   */
  getMainFrames(figmaFile: FigmaFile): string[] {
    const frameIds: string[] = [];

    const traverseNode = (node: FigmaNode, depth = 0) => {
      // Look for FRAME nodes that could be screens/artboards
      if (node.type === 'FRAME' && node.absoluteBoundingBox) {
        // Filter out tiny frames (likely components) and internal frames
        const { width, height } = node.absoluteBoundingBox;
        const isLargeEnough = width > 200 && height > 200;
        const isNotInternalFrame = !node.name.startsWith('_') && !node.name.startsWith('.');
        
        if (isLargeEnough && isNotInternalFrame) {
          frameIds.push(node.id);
          console.log(`Found main frame: ${node.name} (${width}×${height})`);
        }
      }
      
      // Traverse all children, not just CANVAS children
      if (node.children) {
        node.children.forEach(child => traverseNode(child, depth + 1));
      }
    };

    if (figmaFile.document) {
      traverseNode(figmaFile.document);
    }
    
    // If no large frames found, get any frames as fallback
    if (frameIds.length === 0) {
      console.log('No large frames found, looking for any frames...');
      const fallbackTraverse = (node: FigmaNode) => {
        if (node.type === 'FRAME' && !node.name.startsWith('_')) {
          frameIds.push(node.id);
          console.log(`Found fallback frame: ${node.name}`);
        }
        if (node.children) {
          node.children.forEach(child => fallbackTraverse(child));
        }
      };
      fallbackTraverse(figmaFile.document);
    }

    console.log(`Total frames found: ${frameIds.length}`);
    return frameIds;
  }
}

export default FigmaService; 
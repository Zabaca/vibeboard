/**
 * Vision Analysis Service using Groq API
 * Provides screenshot analysis capabilities for component refinement
 */

import type { VisionMetadata } from '../types/component.types';

// Known vision-capable models on Groq (from test-vision-verified.js)
const VISION_MODELS = {
  'llama-4-maverick': 'llama-4-maverick-17b-128e-instruct',
  'llama-4-scout': 'llama-4-scout-17b-16e-instruct', 
  'llava': 'llava-v1.5-7b-4096-preview',
  'llama-3.2-90b': 'llama-3.2-90b-vision-preview',
  'llama-3.2-11b': 'llama-3.2-11b-vision-preview'
} as const;

export type VisionModel = keyof typeof VISION_MODELS;

export interface VisionAnalysisRequest {
  imageDataUrl: string;
  userPrompt: string;
  componentCode?: string;
  preferredModel?: VisionModel;
}

export interface VisionAnalysisResult {
  success: boolean;
  analysis?: string;
  model?: string;
  confidence?: number;
  processingTime?: number;
  tokensUsed?: {
    total: number;
    imageTokens: number;
    textTokens: number;
  };
  error?: string;
  retryable?: boolean;
}

export interface AvailableModel {
  name: string;
  id: string;
  available: boolean;
}

class VisionService {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: VisionModel;
  private rateLimitDelay: number = 2000; // 2 seconds between calls
  private lastCallTime: number = 0;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Use proxy to avoid CORS issues (similar to Cerebras service)
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    this.baseURL = isLocalhost
      ? '/api/groq'  // Vite proxy will need to be configured
      : '/api/groq'; // Netlify Function for production
    
    this.defaultModel = 'llama-4-maverick';
  }

  /**
   * Check which vision models are available on Groq
   */
  async checkAvailableModels(): Promise<AvailableModel[]> {
    try {
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (isLocalhost) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.warn('Failed to check available models:', response.status);
        return Object.entries(VISION_MODELS).map(([name, id]) => ({
          name,
          id,
          available: false
        }));
      }

      const data = await response.json();
      const availableModels = data.data || [];
      
      return Object.entries(VISION_MODELS).map(([name, id]) => ({
        name,
        id,
        available: availableModels.some((m: { id: string }) => m.id === id)
      }));
    } catch (error) {
      console.warn('Error checking available models:', error);
      return Object.entries(VISION_MODELS).map(([name, id]) => ({
        name,
        id,
        available: false
      }));
    }
  }

  /**
   * Validate image size and format for Groq API
   */
  validateImage(imageDataUrl: string): { valid: boolean; error?: string; sizeKB?: number } {
    try {
      // Check if it's a data URL
      if (!imageDataUrl.startsWith('data:image/')) {
        return { valid: false, error: 'Invalid image data URL format' };
      }

      // Calculate base64 size (approximate file size)
      const base64Size = imageDataUrl.length * 0.75; // Base64 is ~33% larger than binary
      const sizeKB = base64Size / 1024;
      const sizeMB = sizeKB / 1024;

      // Groq has a 4MB limit for images
      if (sizeMB > 4) {
        return { 
          valid: false, 
          error: `Image too large: ${sizeMB.toFixed(2)}MB (max 4MB)`,
          sizeKB 
        };
      }

      // Check supported formats
      const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
      
      if (!supportedFormats.includes(mimeType)) {
        return { 
          valid: false, 
          error: `Unsupported image format: ${mimeType}`,
          sizeKB 
        };
      }

      return { valid: true, sizeKB };
    } catch (error) {
      return { 
        valid: false, 
        error: `Image validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create vision analysis prompt based on user refinement request
   */
  private createVisionPrompt(userPrompt: string, componentCode?: string): string {
    const basePrompt = `You are an expert UI/UX designer and React developer analyzing a screenshot of a rendered React component.

Your task is to provide detailed visual analysis that will help improve the component based on the user's specific request.

USER'S REFINEMENT REQUEST: "${userPrompt}"

Please analyze the screenshot and provide:

1. **Visual Layout & Structure**:
   - Overall layout, spacing, and alignment
   - Component hierarchy and organization
   - Container and element proportions

2. **Design & Styling**:
   - Color scheme, typography, and visual consistency
   - Padding, margins, and spacing issues
   - Visual hierarchy and emphasis

3. **UI/UX Issues** (focus on user's request):
   - Problems directly related to the user's refinement request
   - Usability concerns or accessibility issues
   - Visual inconsistencies or design flaws

4. **Specific Recommendations**:
   - Concrete styling changes needed
   - Layout adjustments required
   - Color, spacing, or typography improvements

5. **Implementation Guidance**:
   - CSS properties that need modification
   - React component structure suggestions
   - Responsive design considerations

Focus your analysis on elements that directly relate to the user's refinement request. Be specific about visual details you can observe in the screenshot.`;

    if (componentCode) {
      return basePrompt + `

CURRENT COMPONENT CODE (for context):
\`\`\`javascript
${componentCode.substring(0, 2000)} ${componentCode.length > 2000 ? '...(truncated)' : ''}
\`\`\`

Relate your visual analysis to the code structure when making recommendations.`;
    }

    return basePrompt;
  }

  /**
   * Apply rate limiting between API calls
   */
  private async applyRateLimit(): Promise<void> {
    const timeSinceLastCall = Date.now() - this.lastCallTime;
    if (timeSinceLastCall < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastCall;
      console.log(`Vision API rate limiting: waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastCallTime = Date.now();
  }

  /**
   * Analyze component screenshot with vision AI
   */
  async analyzeComponent(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    // Validate image first
    const validation = this.validateImage(request.imageDataUrl);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        retryable: false
      };
    }

    // Apply rate limiting
    await this.applyRateLimit();

    const model = request.preferredModel || this.defaultModel;
    const modelId = VISION_MODELS[model];
    const visionPrompt = this.createVisionPrompt(request.userPrompt, request.componentCode);

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.makeVisionRequest(modelId, request.imageDataUrl, visionPrompt);
        const processingTime = (Date.now() - startTime) / 1000;

        return {
          success: true,
          analysis: result.analysis,
          model: modelId,
          confidence: result.confidence,
          processingTime,
          tokensUsed: result.tokensUsed
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`Vision analysis attempt ${attempt} failed:`, lastError.message);

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError);
        if (!isRetryable || attempt === this.retryAttempts) {
          break;
        }

        // Wait before retrying
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * attempt; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Vision analysis failed',
      retryable: this.isRetryableError(lastError),
      processingTime: (Date.now() - startTime) / 1000
    };
  }

  /**
   * Make the actual vision API request
   */
  private async makeVisionRequest(
    modelId: string, 
    imageDataUrl: string, 
    prompt: string
  ): Promise<{
    analysis: string;
    confidence?: number;
    tokensUsed?: { total: number; imageTokens: number; textTokens: number };
  }> {
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (isLocalhost) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const requestBody = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: imageDataUrl,
                detail: 'auto'
              } 
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Calculate token usage if available
    let tokensUsed;
    if (data.usage) {
      const totalTokens = data.usage.total_tokens;
      const promptTokens = data.usage.prompt_tokens;
      const textTokens = Math.round(prompt.length / 4); // Rough estimate
      const imageTokens = promptTokens - textTokens;

      tokensUsed = {
        total: totalTokens,
        imageTokens: Math.max(0, imageTokens),
        textTokens
      };
    }

    return {
      analysis,
      tokensUsed
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error | null): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      'rate_limit_exceeded',
      'timeout',
      'network_error',
      'temporary_failure',
      'service_unavailable'
    ];

    return retryableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType)
    );
  }

  /**
   * Create vision metadata object from analysis result
   */
  createVisionMetadata(
    analysisResult: VisionAnalysisResult,
    screenshot: { dataUrl: string; format: 'webp' | 'png' | 'jpeg'; sizeKB: number },
    prompt: string
  ): VisionMetadata | undefined {
    if (!analysisResult.success || !analysisResult.analysis) {
      return undefined;
    }

    return {
      screenshot: {
        dataUrl: screenshot.dataUrl,
        format: screenshot.format,
        capturedAt: Date.now(),
        sizeKB: screenshot.sizeKB
      },
      visionAnalysis: {
        analysis: analysisResult.analysis,
        analyzedAt: Date.now(),
        prompt,
        model: analysisResult.model || 'unknown',
        confidence: analysisResult.confidence
      }
    };
  }
}

export default VisionService;
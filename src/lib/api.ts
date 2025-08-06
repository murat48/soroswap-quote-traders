import { QuoteRequest, Quote, BuildRequest, BuildResponse, SendRequest, SendResponse } from '@/types';
import { API_CONFIG } from './constants';

class SoroswapAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = API_CONFIG.HOST;
    this.apiKey = API_CONFIG.KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('📤 Request body:', options.body);
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        // Timeout ekleyelim
        signal: AbortSignal.timeout(300000), // 30 saniye timeout
      });

      console.log(`📥 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📄 Raw response length:', responseText.length);
      console.log('📄 Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      if (!responseText || responseText.trim() === '') {
        console.error('❌ API returned empty response');
        console.error('Response headers:', [...response.headers.entries()]);
        throw new Error('Empty response from API');
      }
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('Raw response that failed to parse:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('❌ Request timeout after 30 seconds');
          throw new Error('Request timeout - API took too long to respond');
        }
        
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          console.error('❌ Network Error:', error.message);
          throw new Error('Network Error - Check your internet connection or API availability');
        }
      }
      
      // Re-throw diğer hatalar
      throw error;
    }
  }

  

  // async getQuote(request: QuoteRequest): Promise<Quote> {
  //   return this.request<Quote>(`/quote?network=${API_CONFIG.NETWORK}`, {
  //     method: 'POST',
  //     body: JSON.stringify(request),
  //   });
  // }
//   async getQuote(request: QuoteRequest): Promise<Quote> {
//   console.log('🌐 API Method Called');
//   console.log('📤 Request to API:', JSON.stringify(request, null, 2));
  
//   try {
//     const response = await this.request<Quote>(`/quote?network=${API_CONFIG.NETWORK}`, {
//       method: 'POST',
//       body: JSON.stringify(request),
//     });
    
//     console.log('📥 API Response:', JSON.stringify(response, null, 2));
//     return response;
//   } catch (error) {
//     console.error('🔥 API Error:', error);
//     throw error;
//   }
// }
async getQuote(request: QuoteRequest): Promise<Quote> {
  console.log('🌐 API Method Called');
  console.log('📤 Request to API:', JSON.stringify(request, null, 2));
  
  try {
    const response = await this.request<Quote>(`/quote?network=${API_CONFIG.NETWORK}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    console.log('📥 API Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('🔥 API Error:', error);
    throw error;
  }
}
  async createSwapTransaction(request: {
    fromAsset: string;
    toAsset: string;
    amount: string;
    address: string;
  }): Promise<{ success: boolean; transactionXDR?: string; error?: string }> {
    try {
      // İlk olarak quote al
      const quoteRequest: QuoteRequest = {
        assetIn: request.fromAsset,
        assetOut: request.toAsset,
        amount: request.amount,
        tradeType: 'EXACT_IN',
        protocols: ['soroswap'],
        slippageBps: 1000,
        parts: 1,
        maxHops: 1
      };
      
      const quote = await this.getQuote(quoteRequest);
      
      // Sonra transaction build et
      const buildRequest = {
        quote: quote,
        sponsor: request.address,
        from: request.address
      };
      
      const buildResponse = await this.buildTransaction(buildRequest);
      
      return {
        success: true,
        transactionXDR: buildResponse.xdr
      };
    } catch (error) {
      console.error('❌ Create swap transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async buildTransaction(request: BuildRequest): Promise<BuildResponse> {
    return this.request<BuildResponse>(`/quote/build?network=${API_CONFIG.NETWORK}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendTransaction(request: SendRequest): Promise<SendResponse> {
    try {
      // Önce Soroswap API'ya deneyelim
      return await this.request<SendResponse>(`/send?network=${API_CONFIG.NETWORK}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.log('⚠️ Soroswap API failed, trying direct Stellar submission...', error);
      
      // Soroswap API başarısız olursa, doğrudan Stellar network'e gönderelim
      try {
        const stellarResponse = await fetch('/api/submit-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ xdr: request.xdr }),
        });
        
        const stellarResult = await stellarResponse.json();
        
        if (stellarResult.success) {
          return {
            hash: stellarResult.hash || 'Unknown',
            status: 'success',
            message: 'Transaction submitted via Stellar network'
          };
        } else {
          throw new Error(stellarResult.error || 'Stellar submission failed');
        }
      } catch (stellarError) {
        console.error('❌ Both Soroswap and Stellar submission failed:', stellarError);
        throw new Error(`Transaction submission failed: ${stellarError instanceof Error ? stellarError.message : 'Unknown error'}`);
      }
    }
  }
}

export const soroswapAPI = new SoroswapAPI();
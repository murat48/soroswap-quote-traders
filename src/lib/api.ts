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
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    return this.request<Quote>(`/quote?network=${API_CONFIG.NETWORK}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async buildTransaction(request: BuildRequest): Promise<BuildResponse> {
    return this.request<BuildResponse>(`/quote/build?network=${API_CONFIG.NETWORK}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendTransaction(request: SendRequest): Promise<SendResponse> {
    return this.request<SendResponse>(`/send?network=${API_CONFIG.NETWORK}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const soroswapAPI = new SoroswapAPI();
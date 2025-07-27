// /* eslint-disable @typescript-eslint/no-explicit-any */

// import { QuoteRequest, Quote, BuildRequest, BuildResponse, SendRequest, SendResponse } from '@/types';
// import { API_CONFIG } from './constants';

// interface CacheEntry<T> {
//   data: T;
//   timestamp: number;
//   ttl: number;
// }

// class OptimizedSoroswapAPI {
//   private baseURL: string;
//   private apiKey: string;
//   private cache = new Map<string, CacheEntry<any>>();
//   private abortControllers = new Map<string, AbortController>();
  
//   // Connection pooling için headers'ı cache'le
//   private defaultHeaders: HeadersInit;
  
//   // Rate limiting
//   private requestQueue: Array<() => Promise<any>> = [];
//   private activeRequests = 0;
//   private maxConcurrentRequests = 5;
//   private rateLimitDelay = 100; // ms

//   constructor() {
//     this.baseURL = API_CONFIG.HOST;
//     this.apiKey = API_CONFIG.KEY;
//     this.defaultHeaders = {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${this.apiKey}`,
//       'Connection': 'keep-alive',
//       'Keep-Alive': 'timeout=5, max=1000'
//     };
//   }

//   private getCacheKey(endpoint: string, body?: string): string {
//     return `${endpoint}:${body || ''}`;
//   }

//   private isValidCache<T>(entry: CacheEntry<T>): boolean {
//     return Date.now() - entry.timestamp < entry.ttl;
//   }

//   private setCache<T>(key: string, data: T, ttlMs: number = 5000): void {
//     this.cache.set(key, {
//       data,
//       timestamp: Date.now(),
//       ttl: ttlMs
//     });
//   }

//   private async executeWithRateLimit<T>(requestFn: () => Promise<T>): Promise<T> {
//     return new Promise((resolve, reject) => {
//       const execute = async () => {
//         if (this.activeRequests >= this.maxConcurrentRequests) {
//           // Queue'ya ekle
//           this.requestQueue.push(execute);
//           return;
//         }

//         this.activeRequests++;
//         try {
//           const result = await requestFn();
//           resolve(result);
//         } catch (error) {
//           reject(error);
//         } finally {
//           this.activeRequests--;
          
//           // Queue'dan sonraki request'i çalıştır
//           if (this.requestQueue.length > 0) {
//             const nextRequest = this.requestQueue.shift();
//             if (nextRequest) {
//               setTimeout(nextRequest, this.rateLimitDelay);
//             }
//           }
//         }
//       };

//       execute();
//     });
//   }

//   private async request<T>(
//     endpoint: string, 
//     options: RequestInit = {},
//     cacheKey?: string,
//     cacheTTL: number = 5000
//   ): Promise<T> {
//     // Cache kontrolü
//     if (cacheKey && this.cache.has(cacheKey)) {
//       const cached = this.cache.get(cacheKey)!;
//       if (this.isValidCache(cached)) {
//         return cached.data;
//       }
//     }

//     // Önceki aynı request'i iptal et
//     const requestId = `${endpoint}:${JSON.stringify(options.body || {})}`;
//     if (this.abortControllers.has(requestId)) {
//       this.abortControllers.get(requestId)!.abort();
//     }

//     const abortController = new AbortController();
//     this.abortControllers.set(requestId, abortController);

//     return this.executeWithRateLimit(async () => {
//       const url = `${this.baseURL}${endpoint}`;
      
//       try {
//         const response = await fetch(url, {
//           ...options,
//           headers: {
//             ...this.defaultHeaders,
//             ...options.headers,
//           },
//           signal: abortController.signal,
//           // HTTP/2 optimizations
//           ...(typeof window !== 'undefined' && {
//             keepalive: true,
//           })
//         });

//         this.abortControllers.delete(requestId);

//         if (!response.ok) {
//           const errorText = await response.text();
          
//           // Structured error handling
//           let errorData;
//           try {
//             errorData = JSON.parse(errorText);
//           } catch {
//             errorData = { message: errorText };
//           }
          
//           throw new APIError(response.status, errorData.message || errorText, errorData);
//         }

//         const data = await response.json();
        
//         // Cache'le
//         if (cacheKey) {
//           this.setCache(cacheKey, data, cacheTTL);
//         }

//         return data;
//       } catch (error) {
//         this.abortControllers.delete(requestId);
//         if (error instanceof Error && error.name === 'AbortError') {
//           throw new Error('Request was cancelled');
//         }
//         throw error;
//       }
//     });
//   }

//   // Quote - kısa cache (5 saniye)
//   async getQuote(request: QuoteRequest): Promise<Quote> {
//     const cacheKey = this.getCacheKey('/quote', JSON.stringify(request));
    
//     return this.request<Quote>(
//       `/quote?network=${API_CONFIG.NETWORK}`, 
//       {
//         method: 'POST',
//         body: JSON.stringify(request),
//       },
//       cacheKey,
//       5000 // 5 saniye cache
//     );
//   }

//   // Build - cache yok (her seferinde yeni transaction)
//   async buildTransaction(request: BuildRequest): Promise<BuildResponse> {
//     return this.request<BuildResponse>(
//       `/quote/build?network=${API_CONFIG.NETWORK}`, 
//       {
//         method: 'POST',
//         body: JSON.stringify(request),
//       }
//     );
//   }

//   // Send - cache yok
//   async sendTransaction(request: SendRequest): Promise<SendResponse> {
//     return this.request<SendResponse>(
//       `/send?network=${API_CONFIG.NETWORK}`, 
//       {
//         method: 'POST',
//         body: JSON.stringify(request),
//       }
//     );
//   }

//   // Batch operations
//   async getMultipleQuotes(requests: QuoteRequest[]): Promise<Quote[]> {
//     return Promise.all(
//       requests.map(request => this.getQuote(request))
//     );
//   }

//   // Quote + Build combo (çok kullanılan pattern)
//   async getQuoteAndBuild(
//     quoteRequest: QuoteRequest,
//     buildParams: Omit<BuildRequest, 'quote'>
//   ): Promise<{ quote: Quote; build: BuildResponse }> {
//     const quote = await this.getQuote(quoteRequest);
//     const build = await this.buildTransaction({
//       ...buildParams,
//       quote
//     });
    
//     return { quote, build };
//   }

//   // Cache temizleme
//   clearCache(): void {
//     this.cache.clear();
//   }

//   // Aktif request'leri iptal et
//   cancelAllRequests(): void {
//     this.abortControllers.forEach(controller => controller.abort());
//     this.abortControllers.clear();
//   }

//   // Health check
//   async healthCheck(): Promise<boolean> {
//     try {
//       const response = await fetch(`${this.baseURL}/health`, {
//         method: 'GET',
//         headers: this.defaultHeaders,
//         signal: AbortSignal.timeout(5000) // 5 saniye timeout
//       });
//       return response.ok;
//     } catch {
//       return false;
//     }
//   }
// }

// // Custom error class
// class APIError extends Error {
//   constructor(
//     public status: number,
//     message: string,
//     public data?: any
//   ) {
//     super(message);
//     this.name = 'APIError';
//   }
// }

// export const soroswapAPI = new OptimizedSoroswapAPI();

// // Utility functions
// export const SoroswapUtils = {
//   // Retry with exponential backoff
//   async retryRequest<T>(
//     requestFn: () => Promise<T>,
//     maxRetries: number = 3,
//     baseDelay: number = 1000
//   ): Promise<T> {
//     let lastError: Error;
    
//     for (let i = 0; i <= maxRetries; i++) {
//       try {
//         return await requestFn();
//       } catch (error) {
//         lastError = error as Error;
        
//         if (i === maxRetries) break;
        
//         // RouterInsufficientOutputAmount hatası için özel handling
//         if (error instanceof APIError && 
//             error.data?.message?.includes('RouterInsufficientOutputAmount')) {
//           throw error; // Bu hatayı retry'lama
//         }
        
//         const delay = baseDelay * Math.pow(2, i);
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }
    
//     throw lastError!;
//   },

//   // Quote validation
//   validateQuote(quote: Quote): boolean {
//     const priceImpact = parseFloat(quote.priceImpactPct);
//     return priceImpact < 5.0; // %5'ten az price impact
//   },

//   // Amount optimization
//   optimizeAmount(originalAmount: string, priceImpact: number): string {
//     if (priceImpact > 3.0) {
//       // %3'ten fazla impact varsa miktarı azalt
//       const reducedAmount = BigInt(originalAmount) * BigInt(70) / BigInt(100);
//       return reducedAmount.toString();
//     }
//     return originalAmount;
//   }
// };
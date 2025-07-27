import { AssetOption } from '@/types';

export const API_CONFIG = {
  HOST: process.env.NEXT_PUBLIC_SOROSWAP_API_HOST || 'https://soroswap-api-staging-436722401508.us-central1.run.app',
  KEY: process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || 'sk_e2acb3e0b5248f286023ef7ce9a5cde7e087c12579ae85fb3e9e318aeb11c6ce',
  NETWORK: 'testnet' as const,
};

// export const ASSET_OPTIONS: AssetOption[] = [

//   { 
//     value: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM', 
//     label: 'USDC',
//     symbol: 'USDC'
//   },
//   { 
//     value: 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD', 
//     label: 'EURC',
//     symbol: 'EURC'
//   },
//   { 
//     value: 'CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN', 
//     label: 'XTAR',
//     symbol: 'XTAR'
//   }, { 
//     value: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', 
//     label: 'XLM',
//     symbol: 'XLM'
//   },
  
// ];
export const ASSET_OPTIONS: AssetOption[] = [
  {
    value: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    label: 'Stellar Lumens (XLM)',
    symbol: 'XLM'
  },
  {
    value: 'CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN',
    label: 'Dogstar (XTAR)',
    symbol: 'XTAR'
  },
  {
    value: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
    label: 'USDCoin (USDC)',
    symbol: 'USDC'
  },
  {
    value: 'CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE',
    label: 'Ripple (XRP)',
    symbol: 'XRP'
  },
  {
    value: 'CAVCOKZ5XZ5GONIP2M7QJARHZMELBVPZXVTZU5AJEJTOLNWAT5R43LPO',
    label: 'Argentine Peso (ARST)',
    symbol: 'ARST'
  },
  {
    value: 'CCXQWO33QBEUDVTWDDOYLD2SYEJSWUM6DIJUX6NDAOSXNCGK3PSIWQJG',
    label: 'Aquarius (AQUA)',
    symbol: 'AQUA'
  },
  {
    value: 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD',
    label: 'EURC',
    symbol: 'EURC'
  },
  {
    value: 'CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F',
    label: 'Bitcoin (BTC)',
    symbol: 'BTC'
  },
  {
    value: 'CCS2TOJEO7QIWJOM7C6PZ2AKLNDP2UJQIVKGUE6KFS5ULRCN6G7GHITY',
    label: 'Brazilian Real (BRL)',
    symbol: 'BRL'
  },
  {
    value: 'CBSC4KEC3ZFSV33LLDUBISDIO6AWWOETQOFXFVUNESZJIL47N6SDFBQP',
    label: 'wunpyr (WUNP)',
    symbol: 'WUNP'
  },
  {
    value: 'CC5BEKXQJRY7TUD5TBQT7UBOAXU7DKCKXR7BSPFO23OHFABNJCE27UZ4',
    label: 'wuntro (WUNT)',
    symbol: 'WUNT'
  },
  {
    value: 'CA34VPNNRRVH5FMFVXWMQVEDMTOMLZESEZ5LE4724OSBHFB5HIRRHQ7G',
    label: 'pyrzim (PYRZ)',
    symbol: 'PYRZ'
  },
  {
    value: 'CDHNUGDN5ODFN25ADDSDQIOJPQSHFLH3IBFEVMMPYNQKG5Y2UZ5MV4ZW',
    label: 'nylfyx (NYLF)',
    symbol: 'NYLF'
  }
];
export const DEFAULT_PROTOCOLS = ['soroswap'];
export const DEFAULT_SLIPPAGE = 50; // 1% slippage tolerance
export const DEFAULT_FEE_BPS = 50; // 0.5% platform fee
export const DEFAULT_FEE_PARTS = 50; // Split into 5 parts max

// export const DEFAULT_FEE_PARTS = 1; // Split into 5 parts max
export const DEFAULT_FEE_MAXHOPS = 1; // Maximum 2 hops for better liquidity

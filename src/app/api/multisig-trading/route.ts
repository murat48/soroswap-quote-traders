import { NextRequest, NextResponse } from 'next/server';
import MultisigSwapTrader, { MultisigTradeSignal } from '@/lib/MultisigSwapTrader';

// Bot secret key (environment variable'dan alınabilir)
const BOT_SECRET_KEY = process.env.MULTISIG_BOT_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const { signal, action, userSignedXDR } = await request.json();

    // Multisig Trader instance oluştur
    const trader = new MultisigSwapTrader(BOT_SECRET_KEY);

    switch (action) {
      case 'create-trade':
        // Trade signal ile multisig trade oluştur
        if (!signal) {
          return NextResponse.json({ 
            success: false, 
            error: 'Trade signal required' 
          }, { status: 400 });
        }

        const tradeResult = await trader.createSwapTrade(signal as MultisigTradeSignal);
        
        return NextResponse.json(tradeResult);

      case 'submit-trade':
        // User imzalı transaction'ı submit et
        if (!userSignedXDR) {
          return NextResponse.json({ 
            success: false, 
            error: 'User signed XDR required' 
          }, { status: 400 });
        }

        const submitResult = await trader.submitUserSignedTransaction(userSignedXDR);
        
        return NextResponse.json(submitResult);

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Multisig trading API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

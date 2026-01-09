import express from 'express';
import CoinbaseService from '../services/CoinbaseService.js';
import Bet from '../models/Bet.js';
import MarketService from '../services/MarketService.js';

const router = express.Router();
const coinbaseService = new CoinbaseService();
const marketService = new MarketService();

// Coinbase Commerce webhook endpoint
router.post('/coinbase-commerce', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-cc-webhook-signature'];
    const payload = req.body.toString();

    // Verify webhook signature
    if (!coinbaseService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    console.log('Received Coinbase Commerce webhook:', event.type);

    // Process the webhook event
    const result = coinbaseService.processWebhookEvent(event);

    if (result && result.event === 'charge_confirmed') {
      // Find and confirm the bet
      const bet = await Bet.findByCoinbaseChargeId(result.charge_id);
      
      if (bet && bet.status === 'pending') {
        const confirmedBet = await Bet.confirm(bet.id, result.payment_data?.transaction_id);
        
        // Update market odds after new bet
        await marketService.updateMarketOdds(bet.market_id);
        
        console.log(`✅ Bet confirmed: ${confirmedBet.id}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing Coinbase webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    webhooks: {
      coinbase_commerce: '/webhooks/coinbase-commerce'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;

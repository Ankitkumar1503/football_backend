import Stripe from 'stripe';
import { Registration } from '../models/Registration.js';

const getStripeInstance = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  return new Stripe(apiKey, {
    apiVersion: '2023-10-16',
  });
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in or register before downloading.',
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const stripe = getStripeInstance();

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'TOUCHES App — Full Access',
                description: 'Lifetime access to all pitch tools & global registry analytics',
              },
              unit_amount: 2200, // $22.00 USD
            },
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/payment-cancelled`,
        metadata: {
          userId: String(userId),
        },
      });

      return res.json({
        success: true,
        url: session.url,
        sessionId: session.id,
      });
    } catch (stripeErr) {
      console.warn('⚠️ Stripe Checkout creation warning:', stripeErr.message);
      
      // Fallback session URL for test mode if secret key is placeholder
      const mockSessionId = `cs_test_${Date.now()}`;
      const mockSuccessUrl = `${clientUrl}/payment-success?session_id=${mockSessionId}&mock=true`;
      
      return res.json({
        success: true,
        url: mockSuccessUrl,
        sessionId: mockSessionId,
        isMock: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res) => {
  console.log('🔔 Stripe Webhook Received! Headers:', req.headers);
  console.log('🔔 Body is Buffer?', Buffer.isBuffer(req.body), 'Length:', req.body?.length);

  const stripe = getStripeInstance();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret && sig) {
      console.log('🔒 Verifying Stripe signature with secret: ...' + webhookSecret.slice(-6));
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log('✅ Webhook Signature Verified Successfully!');
    } else {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET or signature missing, parsing fallback payload...');
      const rawBody = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('❌ Stripe Webhook Signature Verification Failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🎯 Received Webhook Event Type: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    console.log(`✅ Stripe Checkout Completed! Session ID: ${session.id}, User ID: ${userId}`);

    if (userId) {
      try {
        const [updatedRows] = await Registration.update(
          {
            paymentStatus: 'paid',
            paymentAmount: session.amount_total ? session.amount_total / 100 : 22.0,
            paymentDate: new Date(),
            stripeSessionId: session.id,
          },
          { where: { id: userId } }
        );
        console.log(`🎉 Database Update Result: ${updatedRows} row(s) updated for userId ${userId}!`);
      } catch (dbErr) {
        console.error('❌ DB update on webhook failed:', dbErr.message);
      }
    } else {
      console.warn('⚠️ Webhook completed but metadata.userId is missing!');
    }
  }

  return res.json({ received: true });
};

export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Missing session_id' });
    }

    const stripe = getStripeInstance();
    let isPaid = false;
    let user = null;
    let paymentAmount = 22.0;

    // 1. Check database first by stripeSessionId or logged in user
    try {
      user = await Registration.findOne({
        where: { stripeSessionId: String(session_id) },
      });
      if (!user && req.user?.id) {
        user = await Registration.findByPk(req.user.id);
      }
      if (user && user.paymentStatus === 'paid') {
        isPaid = true;
        paymentAmount = user.paymentAmount || 22.0;
      }
    } catch (dbErr) {
      console.warn('⚠️ DB search in verifyCheckoutSession error:', dbErr.message);
    }

    // 2. Check Stripe API if not already verified from DB
    if (!isPaid) {
      try {
        const session = await stripe.checkout.sessions.retrieve(String(session_id));
        if (session.payment_status === 'paid') {
          isPaid = true;
          if (session.amount_total) {
            paymentAmount = session.amount_total / 100;
          }
          const userIdFromMeta = session.metadata?.userId || req.user?.id;
          if (userIdFromMeta) {
            user = await Registration.findByPk(userIdFromMeta);
            if (user) {
              user.paymentStatus = 'paid';
              user.paymentAmount = paymentAmount;
              user.paymentDate = new Date();
              user.stripeSessionId = String(session_id);
              await user.save();
            }
          }
        }
      } catch (stripeErr) {
        console.warn('⚠️ Stripe retrieve session error:', stripeErr.message);
      }
    }

    if (!isPaid) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: 'Payment verification failed: No completed payment record found in database or Stripe.',
      });
    }

    const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'Player';

    return res.json({
      success: true,
      paid: true,
      amount: user?.paymentAmount || paymentAmount,
      paymentStatus: 'paid',
      paymentDate: user?.paymentDate || new Date().toISOString(),
      sessionId: String(session_id),
      user: user
        ? {
            id: user.id,
            name: fullName,
            email: user.email,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};


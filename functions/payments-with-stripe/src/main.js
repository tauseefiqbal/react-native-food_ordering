import StripeService from './stripe.js';
import AppwriteService from './appwrite.js';
import { isAllowedAppRedirect, safeDecode, throwIfMissing } from './utils.js';

// Must match the Payment Summary shown in app/(tabs)/cart.tsx
const DELIVERY_FEE_CENTS = 500;
const DISCOUNT_CENTS = 50;

export default async (context) => {
  const { req, res, log, error } = context;

  throwIfMissing(process.env, [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FUNCTION_PUBLIC_URL',
    'MENU_COLLECTION_ID',
    'CUSTOMIZATIONS_COLLECTION_ID',
  ]);

  const ordersDatabaseId = process.env.APPWRITE_DATABASE_ID ?? 'orders';
  const ordersCollectionId = process.env.APPWRITE_COLLECTION_ID ?? 'orders';
  const menuDatabaseId = process.env.MENU_DATABASE_ID ?? ordersDatabaseId;
  const publicUrl = process.env.FUNCTION_PUBLIC_URL.replace(/\/+$/, '');

  const appwrite = new AppwriteService(req.headers['x-appwrite-key']);
  const stripe = new StripeService();

  switch (req.path) {
    // Stripe sends the browser here after payment; bounce back into the app.
    case '/success':
    case '/cancel': {
      const redirect = safeDecode(req.query?.redirect);
      const status = req.path === '/success' ? 'success' : 'cancel';
      if (!isAllowedAppRedirect(redirect)) {
        return res.text(`Payment ${status}. You can return to the app.`, 200);
      }
      const separator = redirect.includes('?') ? '&' : '?';
      return res.redirect(`${redirect}${separator}status=${status}`, 302);
    }

    case '/checkout': {
      const userId = req.headers['x-appwrite-user-id'];
      if (!userId) {
        error('User ID not found in request.');
        return res.json({ ok: false, message: 'You must be signed in.' }, 401);
      }

      const { items, redirectUrl } = req.bodyJson ?? {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.json({ ok: false, message: 'Cart is empty.' }, 400);
      }
      if (!isAllowedAppRedirect(redirectUrl)) {
        return res.json({ ok: false, message: 'Invalid redirect URL.' }, 400);
      }

      // Prices are looked up in the database, never taken from the client.
      let lineItems;
      try {
        lineItems = await appwrite.buildLineItems(
          menuDatabaseId,
          process.env.MENU_COLLECTION_ID,
          process.env.CUSTOMIZATIONS_COLLECTION_ID,
          items
        );
      } catch (err) {
        error(err);
        if (err?.code === 404 || err?.message?.startsWith('Invalid cart item')) {
          return res.json({ ok: false, message: 'Some cart items are no longer available.' }, 400);
        }
        return res.json({ ok: false, message: 'Could not price your cart. Please try again.' }, 500);
      }

      lineItems.push({
        price_data: {
          unit_amount: DELIVERY_FEE_CENTS - DISCOUNT_CENTS,
          currency: 'usd',
          product_data: { name: 'Delivery fee (incl. $0.50 discount)' },
        },
        quantity: 1,
      });

      const encodedRedirect = encodeURIComponent(redirectUrl);
      const session = await stripe.checkoutPayment(
        context,
        userId,
        lineItems,
        `${publicUrl}/success?redirect=${encodedRedirect}`,
        `${publicUrl}/cancel?redirect=${encodedRedirect}`
      );
      if (!session) {
        return res.json({ ok: false, message: 'Failed to create Stripe checkout session.' }, 500);
      }

      log(`Created Stripe checkout session ${session.id} for user ${userId}.`);
      return res.json({ ok: true, url: session.url, sessionId: session.id });
    }

    case '/webhook': {
      const event = stripe.validateWebhook(context, req);
      if (!event) {
        return res.json({ success: false }, 401);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const orderId = session.id;

        await appwrite.createOrder(ordersDatabaseId, ordersCollectionId, userId, orderId);
        log(`Created order document for user ${userId} with Stripe order ID ${orderId}`);
      }

      return res.json({ success: true });
    }

    default:
      return res.text('Not Found', 404);
  }
};

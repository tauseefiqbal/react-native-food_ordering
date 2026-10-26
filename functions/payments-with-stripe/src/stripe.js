import stripe from 'stripe';

class StripeService {
  constructor() {
    /** @type {import('stripe').Stripe} */
    // @ts-ignore
    this.client = stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * @param {string} userId
   * @param {import('stripe').Stripe.Checkout.SessionCreateParams.LineItem[]} lineItems
   * @param {string} successUrl
   * @param {string} cancelUrl
   */
  async checkoutPayment(context, userId, lineItems, successUrl, cancelUrl) {
    try {
      return await this.client.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: { userId },
        mode: 'payment',
      });
    } catch (err) {
      context.error(err);
      return null;
    }
  }

  validateWebhook(context, req) {
    try {
      return this.client.webhooks.constructEvent(
        req.bodyBinary,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      context.error(err);
      return null;
    }
  }
}

export default StripeService;

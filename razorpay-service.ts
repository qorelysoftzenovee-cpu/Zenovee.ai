// full/path/to/services/razorpay-service.ts
import Razorpay from 'razorpay';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '@/lib/razorpay-config';
import { prisma } from '@/lib/prisma';
import { getPlanById } from '@/lib/subscription-plans';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const RazorpayService = {
  async createSubscriptionOrder(userId: string, planId: string) {
    const plan = getPlanById(planId);
    if (!plan) {
      throw new Error('Subscription plan not found.');
    }

    // Razorpay plans are typically created once in the Razorpay dashboard.
    // Here, we're creating a subscription for an existing plan.
    // The amount is in paisa (smallest currency unit).
    const amountInPaisa = plan.price * 100;

    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.razorpayPlanId, // This plan_id comes from Razorpay dashboard
        customer_notify: 1, // 1 to send email/SMS to customer
        total_count: 12, // Example: 12 billing cycles
        start_at: Math.floor(Date.now() / 1000), // Start immediately
        // Add other parameters as needed, e.g., notes, addons
      });

      // Save subscription details to your database
      await prisma.payment.create({
        data: {
          userId,
          amount: plan.price,
          currency: 'INR', // Or your currency
          status: 'PENDING',
          orderId: subscription.id, // Use subscription ID as order ID for tracking
          subscriptionId: subscription.id,
        },
      });

      return {
        orderId: subscription.id,
        amount: amountInPaisa,
        currency: 'INR',
        name: plan.name,
        description: `Subscription for ${plan.name} Plan`,
        key_id: RAZORPAY_KEY_ID,
      };
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      throw new Error('Failed to create subscription order.');
    }
  },

  verifyWebhookSignature(signature: string, payload: string, webhookSecret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    return digest === signature;
  },
};
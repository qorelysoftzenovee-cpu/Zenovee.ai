// full/path/to/lib/subscription-plans.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in USD
  credits: number;
  features: string[];
  model: 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'both';
  isPremium: boolean;
  razorpayPlanId: string; // Razorpay Plan ID for recurring billing
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    credits: 500,
    features: [
      'Access to standard tools',
      'Gemini Flash model',
      'Basic support',
    ],
    model: 'gemini-2.0-flash',
    isPremium: false,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER_ID || 'plan_starter_id_placeholder',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    credits: 1200,
    features: [
      'Access to all tools',
      'Faster generations',
      'Priority support',
    ],
    model: 'both',
    isPremium: false,
    razorpayPlanId: process.env.RAZORPAY_PLAN_GROWTH_ID || 'plan_growth_id_placeholder',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 99,
    credits: 3000,
    features: [
      'Premium AI models',
      'Team features',
      'API access',
      'Highest priority',
    ],
    model: 'both',
    isPremium: true,
    razorpayPlanId: process.env.RAZORPAY_PLAN_SCALE_ID || 'plan_scale_id_placeholder',
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(plan => plan.id === id);
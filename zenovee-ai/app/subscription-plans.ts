export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  razorpayInterval: "monthly";
  amountInPaise: number;
  currency: "INR";
  features: string[];
}

export const subscriptionPlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    credits: 400,
    razorpayInterval: "monthly",
    amountInPaise: 2900,
    currency: "INR",
    features: ["400 monthly AI credits", "Core AI tools", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 49,
    credits: 1200,
    razorpayInterval: "monthly",
    amountInPaise: 4900,
    currency: "INR",
    features: ["1200 monthly AI credits", "Usage analytics", "Priority support"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 99,
    credits: 3000,
    razorpayInterval: "monthly",
    amountInPaise: 9900,
    currency: "INR",
    features: ["3000 monthly AI credits", "Advanced controls", "Priority SLA"],
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id);
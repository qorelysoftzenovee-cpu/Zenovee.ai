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
    features: ["400 credits", "Standard tools", "Basic usage limits"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 49,
    credits: 1200,
    razorpayInterval: "monthly",
    amountInPaise: 4900,
    currency: "INR",
    features: ["1200 credits", "All core tools", "Higher usage limits", "Best value"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 99,
    credits: 3000,
    razorpayInterval: "monthly",
    amountInPaise: 9900,
    currency: "INR",
    features: ["3000 credits", "Premium usage", "API access", "Priority limits"],
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id);
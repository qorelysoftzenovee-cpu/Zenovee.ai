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
    price: 299,
    credits: 300,
    razorpayInterval: "monthly",
    amountInPaise: 29900,
    currency: "INR",
    features: ["300 credits", "Standard tools", "Basic usage limits"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 799,
    credits: 1000,
    razorpayInterval: "monthly",
    amountInPaise: 79900,
    currency: "INR",
    features: ["1000 credits", "All core tools", "Higher usage limits", "Best value"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 1999,
    credits: 2100,
    razorpayInterval: "monthly",
    amountInPaise: 199900,
    currency: "INR",
    features: ["2100 credits", "Premium usage", "API access", "Priority limits"],
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id);
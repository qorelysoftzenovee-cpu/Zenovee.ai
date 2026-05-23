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
    credits: 40,
    razorpayInterval: "monthly",
    amountInPaise: 29900,
    currency: "INR",
    features: ["40 credits", "Standard tools", "Basic usage limits"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 799,
    credits: 150,
    razorpayInterval: "monthly",
    amountInPaise: 79900,
    currency: "INR",
    features: ["150 credits", "All core tools", "Higher usage limits", "Best value"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 1999,
    credits: 500,
    razorpayInterval: "monthly",
    amountInPaise: 199900,
    currency: "INR",
    features: ["500 credits", "Premium usage", "API access", "Priority limits"],
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id);
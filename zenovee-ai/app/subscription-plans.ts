export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export const subscriptionPlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    credits: 1000,
    features: ["Single workspace", "Core AI tools", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    credits: 5000,
    features: ["Multi-user access", "Usage analytics", "Priority support"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 199,
    credits: 15000,
    features: ["Enterprise controls", "SLA", "Dedicated onboarding"],
  },
];

export const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id);
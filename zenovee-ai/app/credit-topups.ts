export type CreditTopup = {
  id: "topup-100" | "topup-500" | "topup-1000";
  credits: number;
  priceInr: number;
  amountInPaise: number;
};

export const creditTopups: CreditTopup[] = [
  { id: "topup-100", credits: 100, priceInr: 349, amountInPaise: 34900 },
  { id: "topup-500", credits: 500, priceInr: 1499, amountInPaise: 149900 },
  { id: "topup-1000", credits: 1000, priceInr: 2699, amountInPaise: 269900 },
];

export function getCreditTopupById(id: string) {
  return creditTopups.find((topup) => topup.id === id);
}

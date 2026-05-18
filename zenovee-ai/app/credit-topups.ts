export type CreditTopup = {
  id: "topup-20" | "topup-50" | "topup-150";
  credits: number;
  priceInr: number;
  amountInPaise: number;
};

export const creditTopups: CreditTopup[] = [
  { id: "topup-20", credits: 20, priceInr: 99, amountInPaise: 9900 },
  { id: "topup-50", credits: 50, priceInr: 199, amountInPaise: 19900 },
  { id: "topup-150", credits: 150, priceInr: 499, amountInPaise: 49900 },
];

export function getCreditTopupById(id: string) {
  return creditTopups.find((topup) => topup.id === id);
}

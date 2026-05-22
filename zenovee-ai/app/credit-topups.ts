export type CreditTopup = {
  id: "topup-100" | "topup-500" | "topup-1000";
  credits: number;
  priceInr: number;
  amountInPaise: number;
};

export const creditTopups: CreditTopup[] = [
  { id: "topup-100", credits: 500, priceInr: 799, amountInPaise: 79900 },
  { id: "topup-500", credits: 1050, priceInr: 1499, amountInPaise: 149900 },
  { id: "topup-1000", credits: 2100, priceInr: 2699, amountInPaise: 269900 },
];

export function getCreditTopupById(id: string) {
  return creditTopups.find((topup) => topup.id === id);
}

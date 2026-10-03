export const AGENT_MONTHLY_CREDITS = { personal: 500, professional: 2500 } as const;
export const AGENT_CREDIT_PACK = { credits: 1000, usd: 500, eur: 549 } as const;
export type AgentCreditCurrency = "usd" | "eur";
export const creditPackPrice = (currency: AgentCreditCurrency) => currency === "usd" ? "$5" : "€5.49";

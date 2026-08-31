import type { DealInput } from "./validation";

export const DEAL_STAGES: { value: DealInput["stage"]; label: string }[] = [
  { value: "prospecting", label: "Prospecção" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

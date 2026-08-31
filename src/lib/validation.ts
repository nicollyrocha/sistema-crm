import { z } from "zod";

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório").max(200, "Nome muito longo"),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Email inválido").max(200).optional()
  ),
  phone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  company: z
    .string()
    .trim()
    .max(200, "Nome da empresa muito longo")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, "Notas muito longas")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  status: z.enum(["lead", "active", "inactive"]).default("lead"),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

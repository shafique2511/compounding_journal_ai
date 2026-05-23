import { z } from "zod";

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  aiProvider: z.enum(["openai", "gemini"]),
  timezoneOffsetMinutes: z.coerce.number().int().min(-840).max(840),
  accountStartingBalance: z.coerce.number().min(0),
  accountCurrency: z.string().trim().min(1).max(8).transform((value) => value.toUpperCase()),
});

import { z } from "zod";

export const authEmailSchema = z.object({
  email: z.string().trim().email(),
});

export const authCredentialsSchema = authEmailSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

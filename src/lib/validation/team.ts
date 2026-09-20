import { z } from "zod";

export const createTeamSchema = z.object({
  teamNumber: z.string().trim().min(1, "Enter a VEX team number.").max(16),
  name: z.string().trim().min(2, "Team name must be at least 2 characters.").max(100),
  program: z.literal("V5RC").default("V5RC"),
});

export const joinTeamSchema = z.object({
  code: z.string().trim().min(10, "Enter the full team invite code.").max(128),
});

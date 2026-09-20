"use server";

import { AuthError } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signIn } from "@/auth";
import {
  completeUserOnboarding,
  consumePasswordReset,
  createPasswordResetRequest,
  createUserAccount,
  normalizeUsername,
  previewLoginAttempt,
} from "@/lib/auth/accounts";
import { sendPasswordResetEmail } from "@/lib/email";
import { requireCurrentUser } from "@/lib/authz";
import { databaseErrorMessage, ensureDatabaseReady } from "@/lib/db";
import { isProductionDeployment, smtpConfigured } from "@/lib/runtime-environment";

export type AuthActionState = {
  error?: string;
  success?: string;
  resetUrl?: string | null;
};

function safeCallbackUrl(value: FormDataEntryValue | null | undefined, fallback: string) {
  const callbackUrl = typeof value === "string" ? value.trim() : "";
  return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : fallback;
}

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email address or username.").max(120),
  password: z.string().min(8, "Enter your password."),
  callbackUrl: z.string().trim().default("/app/dashboard"),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    username: z
      .string()
      .trim()
      .min(3, "Choose a username with at least 3 characters.")
      .max(24, "Usernames must stay under 24 characters.")
      .regex(/^[a-zA-Z0-9_.-\s]+$/, "Use letters, numbers, spaces, dashes, dots, or underscores only."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters.").max(200),
    confirmPassword: z.string().min(8, "Confirm your password."),
    callbackUrl: z.string().trim().default("/onboarding"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, "That reset link is invalid."),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  confirmPassword: z.string().min(8, "Confirm your new password."),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Choose a display name.").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Choose a username with at least 3 characters.")
    .max(24, "Usernames must stay under 24 characters.")
    .regex(/^[a-zA-Z0-9_.-\s]+$/, "Use letters, numbers, spaces, dashes, dots, or underscores only."),
  teamNumber: z.string().trim().max(24).optional(),
  experienceLevel: z
    .enum(["JUST_STARTING", "FIRST_SEASON", "ONE_TO_TWO_SEASONS", "THREE_PLUS_SEASONS", "MENTOR_COACH"])
    .nullable(),
  preferredLanguage: z.enum(["VEXCODE_PYTHON", "VEXCODE_CPP", "PROS_CPP", "OTHER"]).nullable(),
  roles: z
    .array(z.enum(["BUILDER", "PROGRAMMER", "DRIVER", "CAD", "NOTEBOOK", "SCOUT", "TEAM_LEAD", "MENTOR"]))
    .min(1, "Choose at least one role."),
  callbackUrl: z.string().trim().default("/app/dashboard"),
});

function validateNormalizedUsername(username: string) {
  if (normalizeUsername(username).length < 3) {
    return "Choose a username with at least 3 letters or numbers.";
  }
  return null;
}

function authActionError(error: unknown, fallback: string) {
  const databaseMessage = databaseErrorMessage(error);
  if (databaseMessage) return databaseMessage;
  if (error instanceof AuthError) {
    if (error.type === "CredentialsSignin") return "That email and password combination was not recognized.";
    return "We could not verify your sign-in request. Try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    callbackUrl: safeCallbackUrl(formData.get("callbackUrl"), "/app/dashboard"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your login details." };

  try {
    await ensureDatabaseReady();
    const eligibility = await previewLoginAttempt(parsed.data.identifier, parsed.data.password);
    if (!eligibility.ok) return { error: eligibility.message };
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl || "/app/dashboard",
    });
  } catch (error) {
    unstable_rethrow(error);
    return { error: authActionError(error, "We could not sign you in.") };
  }

  return { error: "We could not sign you in." };
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    callbackUrl: safeCallbackUrl(formData.get("callbackUrl"), "/onboarding"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the account details and retry." };
  const registerUsernameError = validateNormalizedUsername(parsed.data.username);
  if (registerUsernameError) return { error: registerUsernameError };

  try {
    await ensureDatabaseReady();
    const created = await createUserAccount(parsed.data);
    if (!created.ok) return { error: created.message };
    await signIn("credentials", {
      identifier: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl || "/onboarding",
    });
  } catch (error) {
    unstable_rethrow(error);
    return { error: authActionError(error, "We could not create that account.") };
  }

  return { error: "We could not create that account." };
}

export async function forgotPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  try {
    await ensureDatabaseReady();
    const result = await createPasswordResetRequest(parsed.data.email);
    if (result.resetUrl && smtpConfigured()) {
      await sendPasswordResetEmail({ to: result.email, resetPath: result.resetUrl });
      return {
        success: "If that account exists, a password reset email has been sent.",
      };
    }

    if (result.resetUrl && !isProductionDeployment()) {
      return {
        success: "Password reset created for this local environment. Open the generated link below.",
        resetUrl: result.resetUrl,
      };
    }

    return {
      success: smtpConfigured()
        ? "If that account exists, a password reset email has been sent."
        : "Password reset email is not configured on this deployment yet.",
      resetUrl: null,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { error: authActionError(error, "We could not create a reset link.") };
  }
}

export async function resetPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the reset form and retry." };

  try {
    await ensureDatabaseReady();
    const result = await consumePasswordReset(parsed.data.token, parsed.data.password);
    if (!result.ok) return { error: result.message };
  } catch (error) {
    unstable_rethrow(error);
    return { error: authActionError(error, "We could not reset that password.") };
  }

  redirect("/login?reset=1");
}

export async function completeOnboardingAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    teamNumber: formData.get("teamNumber"),
    experienceLevel: formData.get("experienceLevel") || null,
    preferredLanguage: formData.get("preferredLanguage") || null,
    roles: formData.getAll("roles").filter((value): value is string => typeof value === "string"),
    callbackUrl: formData.get("callbackUrl") ?? "/app/dashboard",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Complete the required onboarding fields." };
  const onboardingUsernameError = validateNormalizedUsername(parsed.data.username);
  if (onboardingUsernameError) return { error: onboardingUsernameError };

  try {
    await ensureDatabaseReady();
    const user = await requireCurrentUser("/onboarding");
    await completeUserOnboarding(user.id, {
      username: normalizeUsername(parsed.data.username),
      displayName: parsed.data.displayName,
      teamNumber: parsed.data.teamNumber,
      experienceLevel: parsed.data.experienceLevel,
      preferredLanguage: parsed.data.preferredLanguage,
      roles: parsed.data.roles,
    });
    revalidatePath("/app/dashboard");
    revalidatePath("/team");
  } catch (error) {
    unstable_rethrow(error);
    return { error: authActionError(error, "We could not save your profile.") };
  }

  redirect(safeCallbackUrl(formData.get("callbackUrl"), "/app/dashboard"));
}

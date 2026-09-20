"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { databaseErrorMessage, ensureDatabaseReady } from "@/lib/db";
import { resetAllDemoData, validDevAccessKey } from "@/lib/dev-access";

export type DevGateState = { error?: string };

function safeCallbackUrl(value: FormDataEntryValue | null) {
  const callbackUrl = typeof value === "string" ? value : "";
  return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/app/dashboard";
}

export async function enterDevModeAction(_: DevGateState, formData: FormData): Promise<DevGateState> {
  const devKey = String(formData.get("devKey") ?? "").trim();
  if (!devKey) return { error: "Enter the DEV access key." };

  try {
    await ensureDatabaseReady();
    await signIn("credentials", {
      devKey,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    const databaseMessage = databaseErrorMessage(error);
    if (databaseMessage) return { error: databaseMessage };
    if (error instanceof AuthError) return { error: "That DEV key was not accepted." };
    throw error;
  }

  return { error: "Could not enter DEV mode. Try again." };
}

export async function resetDemoDataAction(_: DevGateState, formData: FormData): Promise<DevGateState> {
  const devKey = String(formData.get("devKey") ?? "").trim();
  if (!validDevAccessKey(devKey)) return { error: "Enter the DEV key to confirm the reset." };

  try {
    await ensureDatabaseReady();
    await resetAllDemoData();
    await signOut({ redirectTo: "/?reset=1" });
  } catch (error) {
    return { error: databaseErrorMessage(error) ?? (error instanceof Error ? error.message : "Could not reset demo data.") };
  }

  return { error: "Could not reset demo data." };
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/public-layout";

export const metadata: Metadata = {
  title: "Privacy | PitRelay",
  description: "Privacy information for the PitRelay workspace.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" description="Privacy information for a PitRelay deployment that uses real team accounts.">
      <section><h2>Account information</h2><p>PitRelay stores the account information required to authenticate users, manage team membership, and protect private workspace data. This can include name, email address, encrypted password data, and profile preferences.</p></section>
      <section><h2>Private workspace content</h2><p>Team members may create engineering records, tasks, notebook entries, build logs, and other workspace content. Access to private content is restricted by the team membership and role controls configured for that workspace.</p></section>
      <section><h2>External competition information</h2><p>If an administrator configures an official VEX Events integration, the service may retrieve and cache the minimum information needed to show the requested official records. Credentials for that integration remain server-side and are not exposed in the browser.</p></section>
      <section><h2>How information is used</h2><p>Information is used to authenticate users, enforce team permissions, provide collaboration features, maintain security, and present authorized workspace content. PitRelay is not designed to sell private team work to advertisers.</p></section>
      <section><h2>Password reset and service email</h2><p>If SMTP is configured for the deployment, password reset messages are sent from a server-managed email address. If email delivery is not configured, password recovery should be considered unavailable until an administrator completes that setup.</p></section>
    </LegalPage>
  );
}

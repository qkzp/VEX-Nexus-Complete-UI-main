import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/public-layout";

export const metadata: Metadata = {
  title: "Terms | PitRelay",
  description: "Terms for using the PitRelay workspace.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" description="These terms describe use of a PitRelay deployment with authenticated team workspaces.">
      <section><h2>Using the workspace</h2><p>PitRelay is a collaborative robotics workspace. Use it only for legitimate team, educational, or administrative work, and only in teams where you have been authorized to participate.</p></section>
      <section><h2>Accounts and team access</h2><p>Users are responsible for maintaining the security of their account credentials. Team owners and administrators control membership and permissions inside private team workspaces. Treat invite codes as team-scoped access credentials.</p></section>
      <section><h2>Content and records</h2><p>You retain responsibility for material you add to a workspace, including engineering notes, images, code references, and competition research. Do not upload content that is unlawful, infringing, unsafe, or unrelated to the purpose of the team workspace.</p></section>
      <section><h2>External data</h2><p>Competition and ranking information may originate from external official sources. Its availability, accuracy, and update timing remain subject to those sources. PitRelay should not be used to represent unsupported or unavailable data as verified fact.</p></section>
      <section><h2>Changes and access</h2><p>The organization operating a deployment may update features, access rules, or these terms as the service evolves. If a change materially affects your use, review the updated terms before continuing to use the workspace.</p></section>
    </LegalPage>
  );
}

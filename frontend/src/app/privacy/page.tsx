import type { Metadata } from 'next';
import Link from 'next/link';
import { L, LegalLayout, Section } from '@/components/LegalLayout';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summary={
        <ul className="list-disc space-y-1 pl-5">
          <li>Hum sirf wahi data rakhte hain jo English sikhane ke liye zaroori hai.</li>
          <li>18 saal se kam umar ho to parent ki permission ke bina hum aapka data use nahi karte.</li>
          <li>Bachchon ka data advertising, tracking ya profiling ke liye kabhi use nahi hota.</li>
          <li>Aap kabhi bhi apna data download ya account delete kar sakte ho — Settings → Mera data.</li>
          <li>Koi shikayat ho to Grievance Officer se baat karo (neeche contact diya hai).</li>
        </ul>
      }
    >
      <p>
        This Privacy Policy explains how <L value={LEGAL.entityName} /> (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the Data
        Fiduciary for {LEGAL.productName}, collects and uses personal data, in line with the Digital Personal Data
        Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) and the rules made under it.
      </p>

      <Section n={1} title="Data we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account:</strong> name, email address, password (stored only as a one-way hash), and whether you signed in with Google.</li>
          <li><strong>Learning profile:</strong> class/grade, board, state, learning goal and English level you choose during onboarding.</li>
          <li><strong>Age and parental consent:</strong> whether you are under 18, your parent or guardian&apos;s email, and the record of their consent (name, time and IP address of the decision).</li>
          <li><strong>Practice data:</strong> lessons completed, scores, streaks, chat and roleplay messages you send to the AI tutor, and text transcribed from voice practice. We do not store voice recordings.</li>
          <li><strong>Payments:</strong> plan, amount, dates and Razorpay payment identifiers. Card, UPI and bank details are handled by Razorpay and never reach us.</li>
          <li><strong>Technical:</strong> a sign-in cookie, and basic server logs (IP address, time, errors) used for security.</li>
        </ul>
      </Section>

      <Section n={2} title="Why we use it">
        <p>Only to provide and improve English practice for you: running your account, personalising lessons, giving AI feedback, tracking your progress, processing payments and issuing GST invoices, keeping the service secure, and meeting legal obligations. We do not sell personal data.</p>
      </Section>

      <Section n={3} title="Children and parental consent">
        <p>{LEGAL.productName} is used by school students. If you tell us you are under 18, we email the parent or guardian you name and ask for their verifiable consent. Until they agree, your account cannot use any learning features, and we process only what is needed to ask for consent.</p>
        <p>For children we do not carry out tracking, behavioural monitoring or targeted advertising, and we do not show ads. A parent can withdraw consent at any time from the link in our email or by writing to the Grievance Officer; the account is then blocked and can be deleted.</p>
      </Section>

      <Section n={4} title="Who we share it with">
        <p>We use trusted service providers (Data Processors) who act only on our instructions:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>AI tutor:</strong> Google (Gemini) and Anthropic (Claude) process the messages you send to Kiki to generate replies. These providers may process data outside India.</li>
          <li><strong>Payments:</strong> Razorpay processes subscription payments.</li>
          <li><strong>Email and hosting:</strong> our email delivery and cloud hosting providers.</li>
          <li><strong>Error reports:</strong> Sentry receives technical crash reports (no names, emails or messages) so we can fix bugs.</li>
          <li><strong>Product analytics (adults only):</strong> PostHog receives anonymous usage events — which screens are used and where people get stuck — under an opaque id. Learners under 18 are never tracked.</li>
        </ul>
        <p>We may also disclose data when required by law or by a lawful order of a government authority.</p>
      </Section>

      <Section n={5} title="How long we keep it">
        <p>We keep your data while your account is active. When you delete your account, your profile, practice history and chats are erased right away and your sign-in is removed. Payment records and GST tax invoices (which include your name and email) are kept for the period required by Indian tax law, then deleted. Security logs are kept for a limited period.</p>
      </Section>

      <Section n={6} title="Your rights">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Access:</strong> download a copy of your data from Settings → Mera data.</li>
          <li><strong>Correction:</strong> update your profile in Settings, or ask us to correct anything else.</li>
          <li><strong>Erasure:</strong> delete your account from Settings → Mera data.</li>
          <li><strong>Withdraw consent:</strong> you (or your parent, for under-18s) can withdraw consent at any time; this stops the service for that account.</li>
          <li><strong>Grievance redressal and nomination:</strong> contact the Grievance Officer below. If you are not satisfied, you may approach the Data Protection Board of India.</li>
        </ul>
      </Section>

      <Section n={7} title="Cookies">
        <p>We use one essential cookie to keep you signed in securely. We do not use advertising or tracking cookies. Product analytics for adult learners runs without cookies and is switched off entirely for anyone under 18.</p>
      </Section>

      <Section n={8} title="Security">
        <p>Passwords are hashed, sign-in uses short-lived tokens with an httpOnly cookie, and data is sent over encrypted connections. No system is perfectly secure; if a personal data breach affects you, we will inform you and the Data Protection Board as the law requires.</p>
      </Section>

      <Section n={9} title="Changes to this policy">
        <p>If we make important changes, we will tell you in the app and ask you to review them. The version and date at the top always show the current policy.</p>
      </Section>

      <Section n={10} title="Contact and Grievance Officer">
        <p>
          <strong>Grievance Officer:</strong> <L value={LEGAL.grievanceOfficer} />
          <br />
          Email: <L value={LEGAL.grievanceEmail} />
          <br />
          {LEGAL.entityName}, <L value={LEGAL.address} />
        </p>
        <p>
          For general help write to <L value={LEGAL.supportEmail} />. See also our{' '}
          <Link href="/terms" className="font-semibold text-brand-600 underline">Terms of Service</Link>.
        </p>
      </Section>
    </LegalLayout>
  );
}

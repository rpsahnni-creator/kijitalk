import type { Metadata } from 'next';
import Link from 'next/link';
import { L, LegalLayout, Section } from '@/components/LegalLayout';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      summary={
        <ul className="list-disc space-y-1 pl-5">
          <li>18 saal se kam ho to account parent ki permission se hi chalega.</li>
          <li>Kiki ek AI tutor hai — kabhi-kabhi galti kar sakti hai. Zaroori cheezein teacher se confirm karo.</li>
          <li>Premium har mahine apne aap renew hota hai; aap kabhi bhi cancel kar sakte ho.</li>
          <li>App ka galat use (spam, abuse, cheating) mana hai.</li>
        </ul>
      }
    >
      <p>
        These Terms are an agreement between you and <L value={LEGAL.entityName} /> for using {LEGAL.productName}. By
        creating an account you accept these Terms and our{' '}
        <Link href="/privacy" className="font-semibold text-brand-600 underline">Privacy Policy</Link>.
      </p>

      <Section n={1} title="Who can use KijiTalk">
        <p>Anyone can use {LEGAL.productName}. If you are under 18, your parent or legal guardian must give consent before you can use the service, and they accept these Terms on your behalf.</p>
      </Section>

      <Section n={2} title="Your account">
        <p>Give accurate details, keep your password private, and tell us if you think someone else has accessed your account. You are responsible for activity on your account.</p>
      </Section>

      <Section n={3} title="Acceptable use">
        <p>Do not misuse the service: no harassment, hateful or sexual content, spam, attempts to break or overload the system, scraping, or using the AI tutor to produce harmful content. We may suspend accounts that break these rules.</p>
      </Section>

      <Section n={4} title="The AI tutor">
        <p>Kiki uses AI models to give feedback. AI can be wrong or incomplete, so treat its answers as practice help, not as professional or exam advice. Please do not share sensitive personal information in chats.</p>
      </Section>

      <Section n={5} title="Free and Premium plans">
        <ul className="list-disc space-y-1 pl-5">
          <li>The Free plan has a daily limit on AI practice.</li>
          <li>Premium is a monthly subscription billed through Razorpay. Prices include GST, and we email a GST tax invoice for every payment.</li>
          <li>Your subscription renews automatically each month until you cancel. You can cancel any time from the Premium page; you keep Premium until the end of the period you have paid for.</li>
          <li>Payments are non-refundable for a period already started, except where the law requires a refund or we charged you in error.</li>
          <li>If we change the price, we will tell you before it applies to your next renewal.</li>
        </ul>
      </Section>

      <Section n={6} title="Content">
        <p>Lessons, design and software belong to us or our licensors. You keep the rights to what you write; you allow us to process it to provide the service as described in the Privacy Policy.</p>
      </Section>

      <Section n={7} title="Ending your account">
        <p>You can delete your account at any time from Settings. We may suspend or close accounts that break these Terms, with notice where reasonable.</p>
      </Section>

      <Section n={8} title="Liability">
        <p>We work to keep {LEGAL.productName} available and accurate, but provide it &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for indirect losses, and our total liability for any claim is limited to the amount you paid us in the three months before it. Nothing here limits rights you have under Indian consumer law.</p>
      </Section>

      <Section n={9} title="Law and disputes">
        <p>
          These Terms are governed by the laws of India. Courts at <L value={LEGAL.jurisdictionCity} /> have
          jurisdiction, subject to any right you have to approach a consumer forum.
        </p>
      </Section>

      <Section n={10} title="Contact">
        <p>
          {LEGAL.entityName}, <L value={LEGAL.address} />. Email: <L value={LEGAL.supportEmail} />. Complaints:
          Grievance Officer <L value={LEGAL.grievanceOfficer} />, <L value={LEGAL.grievanceEmail} />.
        </p>
      </Section>
    </LegalLayout>
  );
}

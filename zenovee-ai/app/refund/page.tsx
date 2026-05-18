import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Refund Policy | Zenovee AI",
  description: "Refund Policy for Zenovee AI platform",
};

export default async function RefundPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />

      <main className="section-shell py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Refund Policy</h1>
            <p className="text-muted-foreground">
              Last updated: May 16, 2026
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Overview</h2>
            <p className="text-foreground/90 leading-relaxed">
              This Refund Policy outlines the circumstances under which refunds may be issued for Zenovee AI subscription plans and usage charges. Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Non-Refundable Items</h2>
            <p className="text-foreground/90 leading-relaxed">
              The following are non-refundable:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Used credits in any form</li>
              <li>Completed AI model invocations and their outputs</li>
              <li>Subscription fees for periods that have already commenced</li>
              <li>Upgrade or downgrade fees</li>
              <li>Admin overrides or manual credit adjustments already consumed</li>
              <li>Promotional credits that have been exhausted</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Refund Eligibility</h2>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.1 Accidental Charges</h3>
                <p className="text-foreground/90 leading-relaxed">
                  If you are charged in error or without authorization, you may request a refund within 30 days of the charge. You must provide evidence of the error.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.2 Failed Transactions</h3>
                <p className="text-foreground/90 leading-relaxed">
                  If a transaction appears to have been processed multiple times due to a system error, we will refund the duplicate charges. Please report this within 30 days.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.3 Billing Disputes</h3>
                <p className="text-foreground/90 leading-relaxed">
                  If you dispute a charge through your credit card issuer, we reserve the right to suspend your account pending resolution. If the dispute is resolved in your favor, we will reactivate your account.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Cancellation and Subscription Termination</h2>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.1 How to Cancel</h3>
                <p className="text-foreground/90 leading-relaxed">
                  You can cancel your subscription at any time through your account settings or by contacting support@yourdomain.com. Cancellation takes effect at the end of your current billing cycle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.2 No Refunds for Cancellation</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Cancellation of your subscription does not entitle you to a refund of subscription fees for the current billing period or any prepaid credits. Your access will continue until the end of the paid period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.3 Immediate Termination</h3>
                <p className="text-foreground/90 leading-relaxed">
                  If we terminate your account due to violation of our Terms of Service or Acceptable Use Policy, no refunds will be issued.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Credit Policy</h2>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.1 Credit Expiration</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Monthly credits allocated as part of your subscription plan are valid only for the billing period in which they are allocated. Unused credits do not roll over to the next month and expire at the end of each billing cycle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.2 No Cash Conversion</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Credits cannot be exchanged for cash, refunded, or used outside of the Zenovee AI platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.3 Bonus Credits</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Promotional or bonus credits are non-transferable, non-refundable, and may have an expiration date specified at the time of issuance.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Service Credits</h2>
            <p className="text-foreground/90 leading-relaxed">
              In the event of extended service outages or failures beyond your control, we may issue service credits at our sole discretion. Service credits:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Are applied to your account as credits, not cash refunds</li>
              <li>Do not constitute a waiver of our liability limitations</li>
              <li>May not be combined with other promotions</li>
              <li>Expire if not used within the specified period</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Refund Process</h2>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">7.1 Submitting a Refund Request</h3>
                <p className="text-foreground/90 leading-relaxed">
                  To request a refund, email support@yourdomain.com with your account information, order ID, and reason for the refund request. Include any supporting documentation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">7.2 Review Period</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Refund requests are reviewed within 5-7 business days. You will be notified of the decision via email.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">7.3 Processing Time</h3>
                <p className="text-foreground/90 leading-relaxed">
                  If approved, refunds are processed to your original payment method within 5-10 business days. Your bank may take additional time to credit the funds.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Chargeback Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you initiate a chargeback through your credit card issuer, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Immediately suspend your account</li>
              <li>Prevent further access to the Service</li>
              <li>Recover chargeback fees charged to us by your financial institution</li>
              <li>Reserve the right to pursue legal action if appropriate</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              Always contact support@yourdomain.com first to resolve billing disputes before initiating a chargeback.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. No Liability for Unused Credits</h2>
            <p className="text-foreground/90 leading-relaxed">
              Zenovee AI is not responsible for lost or unused credits due to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Account suspension or termination</li>
              <li>Credit expiration at the end of billing cycles</li>
              <li>User inactivity or negligence</li>
              <li>Technical issues on the user&apos;s end</li>
              <li>Loss of account access</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact and Dispute Resolution</h2>
            <p className="text-foreground/90 leading-relaxed">
              For refund requests or billing disputes, contact:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-foreground font-semibold">Support Team</p>
              <p className="text-foreground/90">Email: support@yourdomain.com</p>
              <p className="text-foreground/90">Response time: Within 24-48 hours</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Policy Changes</h2>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Your continued use of the Service constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

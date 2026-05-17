import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Terms of Service | Zenovee AI",
  description: "Terms of Service for Zenovee AI platform",
};

export default async function TermsPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />

      <main className="section-shell py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: May 16, 2026
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-foreground/90 leading-relaxed">
              By accessing and using the Zenovee AI platform (the &ldquo;Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Account Registration</h2>
            <p className="text-foreground/90 leading-relaxed">
              You agree to provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
            <p className="text-foreground/90 leading-relaxed">
              You agree not to use the Service for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Illegal activities or content</li>
              <li>Harassment, abuse, or threats</li>
              <li>Generating malicious content or code</li>
              <li>Attempting to bypass security measures</li>
              <li>Accessing others&apos; data without authorization</li>
              <li>Creating spam, phishing, or fraudulent content</li>
              <li>Violating intellectual property rights</li>
              <li>Reverse engineering or attempting to access source code</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Subscription and Billing</h2>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.1 Subscription Plans</h3>
                <p className="text-foreground/90 leading-relaxed">
                  We offer three subscription tiers: Starter, Growth, and Scale. Each plan includes a monthly credit allocation that resets at the beginning of each billing cycle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.2 Billing Information</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Billing occurs monthly on the anniversary of your subscription date. You authorize us to charge your payment method on file for all fees and charges. If payment fails, we may suspend your access to paid features.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.3 Auto-Renewal</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Your subscription will automatically renew each billing period unless you cancel. You can cancel anytime through your account settings or by contacting support.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.4 Credits</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Credits are non-refundable and non-transferable. Unused credits do not roll over to the next billing cycle. Credit costs are based on actual AI model usage and are deducted in real-time.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Acceptable Use Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              We monitor usage to detect and prevent abuse. We reserve the right to suspend or terminate accounts that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Engage in excessive API calls or rate limit violations</li>
              <li>Use the Service to probe security vulnerabilities</li>
              <li>Create multiple accounts to circumvent limits</li>
              <li>Resell or redistribute the Service</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Generate malicious, harmful, or illegal content</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Intellectual Property Rights</h2>
            <p className="text-foreground/90 leading-relaxed">
              All content, features, and functionality are owned by Zenovee AI. You retain rights to content you generate through our Service, but grant us a license to use it for improvement and analytics purposes. You may not reproduce, distribute, or transmit the Service itself without permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
            <p className="text-foreground/90 leading-relaxed">
              To the maximum extent permitted by law, Zenovee AI shall not be liable for any indirect, incidental, special, or consequential damages resulting from use of or inability to use the Service, including but not limited to data loss, business interruption, or lost profits.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-4">
              Our total liability shall not exceed the fees paid by you in the three months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Service Modifications</h2>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We will not be liable if the Service is modified or discontinued.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Termination</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Third-Party Content</h2>
            <p className="text-foreground/90 leading-relaxed">
              The Service may contain links to third-party websites and services that are not controlled by Zenovee AI. We are not responsible for the content, accuracy, or practices of any third-party sites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Disclaimers</h2>
            <p className="text-foreground/90 leading-relaxed">
              The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. We make no warranties, expressed or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-4">
              AI-generated content may contain errors or inaccuracies. Users are responsible for reviewing and validating all outputs before use. We do not guarantee that the Service will meet your requirements or that it will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Governing Law</h2>
            <p className="text-foreground/90 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws applicable in the jurisdiction where Zenovee AI operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Changes to Terms</h2>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-foreground font-semibold">Legal Team</p>
              <p className="text-foreground/90">Email: legal@zenovee.com</p>
              <p className="text-foreground/90">Email: support@zenovee.com</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

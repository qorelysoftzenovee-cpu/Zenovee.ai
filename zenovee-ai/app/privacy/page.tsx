import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Privacy Policy | Zenovee AI",
  description: "Privacy Policy for Zenovee AI platform",
};

export default async function PrivacyPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />

      <main className="section-shell py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: May 16, 2026
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed">
              Zenovee AI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our,&rdquo; or &ldquo;Company&rdquo;) operates the Zenovee AI platform (the &ldquo;Service&rdquo;). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Information Collection and Use</h2>
            <p className="text-foreground/90 leading-relaxed">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Data:</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Email address</li>
                  <li>First and last name</li>
                  <li>Phone number (optional)</li>
                  <li>Company information (optional)</li>
                  <li>Payment and billing information</li>
                  <li>Usage data and analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Data:</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Browser type and version</li>
                  <li>IP address</li>
                  <li>Pages visited and time spent</li>
                  <li>Features used and AI tool interactions</li>
                  <li>Device information</li>
                  <li>API usage patterns</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Use of Data</h2>
            <p className="text-foreground/90 leading-relaxed">
              Zenovee AI uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraud</li>
              <li>To provide billing services and process payments</li>
              <li>To track AI usage for accurate credit calculation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Security of Data</h2>
            <p className="text-foreground/90 leading-relaxed">
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure API authentication and rate limiting</li>
              <li>Regular security audits and penetration testing</li>
              <li>Compliance with SOC 2 standards</li>
              <li>User access controls and role-based permissions</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. AI Content and Data Processing</h2>
            <p className="text-foreground/90 leading-relaxed">
              When you use our AI tools, we process your inputs through third-party AI providers. We do not use your content for training purposes unless explicitly authorized. Your AI usage is tracked for billing purposes and to prevent abuse.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Third-Party Services</h2>
            <p className="text-foreground/90 leading-relaxed">
              Our Service may contain links to other sites that are not operated by us. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party service before providing your personal information.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We use third-party service providers for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Payment processing (Razorpay)</li>
              <li>AI model providers (Vertex AI, Groq, Gemini)</li>
              <li>Cloud infrastructure (Supabase, GCP)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Retention of Data</h2>
            <p className="text-foreground/90 leading-relaxed">
              Zenovee AI will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Your Rights</h2>
            <p className="text-foreground/90 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of promotional communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              To exercise these rights, please contact us at support@yourdomain.com.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top of this Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-foreground font-semibold">Support Team</p>
              <p className="text-foreground/90">Email: support@yourdomain.com</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

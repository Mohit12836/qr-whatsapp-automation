import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — JAIN DIGITAL SERVICE VISMART',
  description: 'Privacy Policy for JAIN DIGITAL SERVICE VISMART WhatsApp CRM Platform',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last Updated: October 2026</p>

        <section className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Overview</h2>
            <p>
              Welcome to <strong>JAIN DIGITAL SERVICE VISMART</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by 
              <strong> Jain Digital Service India Vismart</strong>. This Privacy Policy outlines how our application and WhatsApp Business solutions collect, 
              process, and protect your information when utilizing our customer management and AI sales tools.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Information:</strong> Phone numbers, customer names, and profile information provided via WhatsApp interactions.</li>
              <li><strong>Message Metadata:</strong> Inbound and outbound message text, timestamps, delivery statuses, and template interactions.</li>
              <li><strong>Technical Identifiers:</strong> WhatsApp Business Account ID (WABA), Phone Number IDs, and webhook transaction identifiers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. How We Use Information</h2>
            <p>The information processed is used strictly to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Facilitate customer support, product inquiries, and automated sales replies via the Meta WhatsApp Cloud API.</li>
              <li>Maintain contact records, lead scores, and communication histories in your secure CRM dashboard.</li>
              <li>Ensure end-to-end delivery of approved utility and marketing template notifications.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Meta WhatsApp Cloud API Compliance</h2>
            <p>
              Our application adheres strictly to the <strong>Meta Platform Terms</strong> and <strong>WhatsApp Business Terms of Service</strong>. 
              We do not sell, rent, or trade your personal or conversational data to third parties. Data processed via WhatsApp APIs is encrypted in transit and stored securely.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data Retention and Deletion</h2>
            <p>
              Users have the right to request deletion of their contact records and message history at any time. Requests for data erasure can be submitted to our administrative team.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Contact Us</h2>
            <p>
              For questions regarding this policy or our data practices, please reach out to us at:
            </p>
            <p className="mt-2 text-indigo-400 font-medium">
              Email: mohit12836@gmail.com<br />
              Business Entity: Jain Digital Service India Vismart<br />
              Platform: JAIN DIGITAL SERVICE VISMART
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

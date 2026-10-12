import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — JAIN DIGITAL SERVICE VISMART',
  description: 'Terms of Service for JAIN DIGITAL SERVICE VISMART WhatsApp CRM Platform',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-8">Last Updated: October 2026</p>

        <section className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the <strong>JAIN DIGITAL SERVICE VISMART</strong> CRM platform (&quot;Service&quot;), operated by 
              <strong> Jain Digital Service India Vismart</strong>, you agree to comply with and be bound by these Terms of Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. WhatsApp Business Platform Terms</h2>
            <p>
              Users of our Service must comply with all <strong>Meta Developer Terms</strong>, <strong>WhatsApp Business Messaging Policies</strong>, 
              and applicable local telecommunication laws. Sending unsolicited spam, illicit content, or violating user opt-in requirements is strictly prohibited.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Service Description & Automated Messaging</h2>
            <p>
              Our Service provides customer relationship management, contact synchronization, and automated conversational tools via official WhatsApp Cloud APIs. 
              You acknowledge that messaging costs, delivery rates, and account tier limits are subject to Meta&apos;s platform guidelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. User Account & Data Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and system user tokens. 
              We implement industry-standard encryption protocols (AES-GCM) to safeguard stored credentials.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Limitation of Liability</h2>
            <p>
              Jain Digital Service India Vismart shall not be liable for any indirect, incidental, or consequential damages resulting from platform downtime, 
              Meta policy enforcement, or unauthorized account access beyond our reasonable control.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Contact Information</h2>
            <p>
              For any questions or legal inquiries regarding these Terms, please contact:
            </p>
            <p className="mt-2 text-indigo-400 font-medium">
              Email: mohit12836@gmail.com<br />
              Entity: Jain Digital Service India Vismart
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

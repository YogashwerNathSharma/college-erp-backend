import React from "react";

export const TENANT_AGREEMENT_VERSION = "1.0";

type TenantAgreementProps = {
  onClose?: () => void;
  onAccept?: () => void;
};

export default function TenantAgreement({ onClose, onAccept }: TenantAgreementProps) {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-950 text-white px-6 py-5 flex items-center gap-4">
        <img src="/ynlogo.png" alt="YN Software" className="h-14 w-14 object-contain rounded-xl bg-white p-1" />
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">YN Software School ERP</h1>
          <p className="text-slate-300 text-sm">SaaS Subscription &amp; Software License Agreement · Version {TENANT_AGREEMENT_VERSION}</p>
        </div>
        <div className="hidden sm:block text-right text-xs text-slate-300">
          <div className="font-semibold text-white">Software Owner</div>
          <div>Yogashwer Nath Sharma</div>
          <div>YN Software</div>
        </div>
      </div>

      <div className="max-h-[68vh] overflow-y-auto px-6 py-6 md:px-10 space-y-6 text-sm leading-6 text-slate-700">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="font-bold text-indigo-950">Please review this agreement before registering your institution.</div>
          <div className="mt-1 text-indigo-900">Registration creates a separate tenant account and confirms acceptance of the subscription and software-license terms below.</div>
        </div>

        <section><h2 className="text-base font-bold text-slate-900">1. Parties and Purpose</h2><p>This Agreement is between YN Software, owned and operated by <strong>Yogashwer Nath Sharma</strong> (the “Provider”), and the educational institution registering for or using the YN Software School ERP (the “Tenant” or “School”). It governs subscription-based access to the hosted ERP platform and related services.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">2. Subscription-Based Access</h2><p>The School receives a limited, non-exclusive, non-transferable and revocable right to access and use the ERP during an active subscription or explicitly granted trial period. Registration or payment does not transfer ownership of the software, source code, architecture, APIs, templates, workflows, designs or underlying intellectual property.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">3. Software Ownership and Intellectual Property</h2><p>All rights, title and interest in the ERP platform, its codebase, UI, architecture, database design, reusable components, YN-UDP, YN-UDP Designer, documentation, templates, platform logic and future improvements remain with <strong>YN Software / Yogashwer Nath Sharma</strong>, except for third-party components that remain subject to their respective licenses.</p><p className="mt-2">The School shall not copy, reverse engineer, decompile, resell, sublicense, publish, distribute, extract or provide the source code or backend infrastructure to any third party.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">4. Tenant Account and Registration</h2><p>Each registered School is provisioned as a separate tenant. The School is responsible for providing accurate registration information, maintaining administrator credentials, and restricting access to authorized personnel. Tenant isolation and access controls are part of the platform architecture, but the School remains responsible for its own user accounts.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">5. Plans, Fees and Limits</h2><p>Subscription plans, prices, duration, included features, student/teacher/admin limits and storage limits are those displayed in the ERP at the time of subscription. A plan may be changed, renewed or upgraded according to the platform’s available options.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">6. Trial and Promotional Access</h2><p>Any free trial or promotional access is provided at the Provider’s discretion and is subject to the applicable plan rules. Trial access may expire automatically and does not create a permanent right to use the platform.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">7. Payment and Renewal</h2><p>Paid subscriptions require successful payment through the supported payment process. Subscription dates and payment status are recorded by the ERP. Renewal is subject to the selected plan and any applicable renewal setting. The Provider may restrict access when a subscription expires, is cancelled, suspended or remains unpaid.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">8. Cancellation, Suspension and Expiry</h2><p>Access may be suspended or terminated for subscription expiry, non-payment, misuse, security concerns, unlawful activity or material breach of this Agreement. The Provider may also suspend an account when necessary to protect the platform or other tenants.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">9. School Data</h2><p>The School retains its rights in data that it lawfully enters into the ERP. The Provider does not acquire ownership of the School’s student, staff, fee, academic or operational data merely because the data is stored or processed by the platform.</p><p className="mt-2">The School is responsible for the legality, accuracy and authorization of data uploaded to the ERP and for obtaining any permissions required to process personal information.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">10. Privacy and Security</h2><p>The Provider will use reasonable technical and organizational measures appropriate to the hosted service. No internet-based system can guarantee absolute security or uninterrupted availability. The School must use strong passwords, authorized users and appropriate internal security controls.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">11. Backups and Data Recovery</h2><p>Backup and recovery features, where enabled or included in the selected plan, are intended to reduce operational risk. They should not be treated as a substitute for the School maintaining any records it is legally required to retain.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">12. Customization and Configuration</h2><p>Tenant-specific configuration, branding, masters, templates and permitted customizations may be provided through the ERP. Unless a separate written agreement states otherwise, customization work does not transfer ownership of the underlying platform or source code.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">13. Acceptable Use</h2><p>The School shall use the ERP only for lawful educational and administrative purposes. It shall not attempt unauthorized access, interfere with another tenant, introduce malicious code, abuse APIs, circumvent subscription controls, or use the platform for unlawful content or activity.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">14. Third-Party Services</h2><p>The ERP may integrate with third-party services such as payment gateways, cloud storage, messaging providers or other APIs. Such services may have separate terms, fees, availability and privacy policies. The Provider is not responsible for outages or policy changes originating solely from those third parties.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">15. Support and Maintenance</h2><p>Support and maintenance are provided according to the selected commercial plan or separate support commitment. Platform updates, bug fixes, security improvements and feature changes may be introduced over time without transferring any ownership rights to the School.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">16. Availability and Changes</h2><p>The Provider will make reasonable efforts to keep the service available but does not guarantee uninterrupted service. Maintenance, upgrades, infrastructure incidents, third-party outages or circumstances beyond reasonable control may temporarily affect availability.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">17. Confidentiality</h2><p>Each party should protect confidential business, technical and operational information received from the other party. The Provider’s source code, architecture, credentials, security mechanisms and non-public technical information are confidential and must not be disclosed by the School.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">18. Limitation of Liability</h2><p>To the extent permitted by applicable law, the Provider will not be liable for indirect, incidental, special or consequential loss arising from use or inability to use the service. The School remains responsible for its operational decisions, data accuracy and compliance obligations.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">19. Governing Law and Disputes</h2><p>This Agreement is intended to be governed by applicable laws of India. The parties should first attempt to resolve disputes in good faith. Any jurisdiction clause or dispute mechanism may be supplemented by a separately signed commercial agreement.</p></section>
        <section><h2 className="text-base font-bold text-slate-900">20. Acceptance and Electronic Record</h2><p>By selecting “I Agree &amp; Continue” and subsequently submitting the tenant registration, the authorized representative confirms that they have read and accepted this Agreement on behalf of the School. The ERP records the tenant, agreement version, accepting name/email, timestamp and technical request information for audit purposes.</p></section>

        <section className="rounded-xl border border-indigo-200 bg-white p-4 opacity-100">
          <h2 className="text-base font-bold text-indigo-950">Provider / Software Owner</h2>
          <div className="mt-3 flex items-center gap-4">
            <img src="/ynlogo.png" alt="YN Software logo" className="h-16 w-16 object-contain rounded-xl bg-slate-100 p-1 border border-indigo-100" />
            <div className="opacity-100">
              <div className="font-bold text-slate-950">Yogashwer Nath Sharma</div>
              <div className="text-slate-700">Owner &amp; Developer · YN Software</div>
              <div className="text-slate-700">Software: YN Software School ERP</div>
            </div>
          </div>
        </section>

        <p className="text-xs text-slate-500">Agreement Version {TENANT_AGREEMENT_VERSION} · Effective for new electronic acceptances from 09 September 2026.</p>
      </div>

      <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50">
        {onClose && <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100">Review Later</button>}
        {onAccept && <button onClick={onAccept} className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700">✓ I Agree &amp; Continue</button>}
        {!onAccept && onClose && <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">Close Agreement</button>}
      </div>
    </div>
  );
}

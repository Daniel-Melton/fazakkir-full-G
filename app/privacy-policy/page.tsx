import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Fazakkir Academy",
  description: "Privacy policy and child data protection commitments at Fazakkir Academy.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <section className="pt-12 pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-3">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white">Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-2">
            Last Updated: September 2026 • Dedicated to safeguarding Muslim families and young learners
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-white p-7 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Our Commitment to Family Privacy</h2>
            <p>
              At Fazakkir Academy (fazakkir.com), we place the highest priority on confidentiality, moral integrity, and digital security. This Privacy Policy details how we collect, handle, and protect student and guardian information across all our educational programs.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Parent & Guardian Details:</strong> Full name, primary email address, and WhatsApp phone number for coordination and lesson scheduling.</li>
              <li><strong>Student Profile:</strong> First name, approximate age, and current proficiency level in Quran recitation or Arabic.</li>
              <li><strong>Educational Logs:</strong> Attendance records, teacher evaluation notes, and homework progress stored securely in our database.</li>
              <li><strong>Payment Records:</strong> We do not store or process sensitive credit card numbers directly; all billing is handled by verified, PCI-DSS compliant third-party payment gateways.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Child Online Safety (COPPA Compliance)</h2>
            <p>
              Because many of our students are minors, we enforce strict child protection standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mt-2">
              <li>All accounts and communications must be managed or approved directly by a parent or legal guardian.</li>
              <li>We never sell, rent, or trade student personal data or contact details to any third-party marketing networks.</li>
              <li>Live virtual classrooms are conducted in monitored 1-on-1 settings by background-checked Azhari instructors.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. WhatsApp & Communication Protocols</h2>
            <p>
              When submitting an assessment request, you consent to receive direct coordination updates via WhatsApp or email strictly pertaining to lesson schedules, progress reports, and teacher match details. You may opt out of notifications at any point by texting our support team.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">5. Data Retention & Guardian Rights</h2>
            <p>
              Parents hold the absolute right to view, update, or request permanent deletion of their family profile and progress logs from our Supabase records at any time by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">6. Contact Academic Administration</h2>
            <p>
              For privacy-related inquiries, data requests, or supervision concerns:
            </p>
            <p className="mt-2 text-emerald-800 font-semibold">
              Email: <a href="mailto:support@fazakkir.com" className="underline">support@fazakkir.com</a> (or lonelywolf1452@gmail.com)
            </p>
          </div>

        </div>
      </section>

      <footer className="bg-[#022c22] text-[#a7f3d0] py-8 text-center text-sm border-t border-emerald-950">
        <p>© 2026 Fazakkir Academy. All rights reserved.</p>
      </footer>
    </main>
  );
}
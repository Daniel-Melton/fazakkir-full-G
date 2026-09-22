import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service & Refund Policy | Fazakkir Academy",
  description: "Terms of service, attendance guidelines, and money-back guarantee policy at Fazakkir Academy.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <section className="pt-12 pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-3">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white">Terms & Refunds</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service & Refunds</h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-2">
            Clear, transparent policies built on Islamic ethics and fair dealings
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-white p-7 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. 100% Free Trial Guarantee</h2>
            <p>
              Every new student is entitled to 2 complimentary 1-on-1 assessment sessions. No payment details, credit cards, or commitments are required. If you decide not to proceed after your trial classes, you owe nothing.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Scheduling & Make-Up Classes (Rescheduling)</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Advance Notice:</strong> If a student cannot attend a scheduled session due to an emergency or exam, simply inform your coordinator or tutor at least 4 hours in advance.</li>
              <li><strong>Make-Up Classes:</strong> All excused missed sessions will be rescheduled at a mutually agreed time with no extra charge.</li>
              <li><strong>Tutor Absence:</strong> In the rare event a tutor cannot make a class, a substitute certified Azhari teacher or an immediate make-up slot will be arranged.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Monthly Subscriptions & Flexibility</h2>
            <p>
              Tuition is billed on a month-to-month basis with zero lock-in contracts. You can pause, adjust weekly frequency, or switch tutors at any time without financial penalties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Money-Back & Refund Policy</h2>
            <p>
              We stand behind our educational standard. If at any time during your first paid month you feel dissatisfied with the teaching pace or quality, notify our management within 14 days and we will issue a prompt prorated refund for all remaining unattended sessions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">5. Respectful Learning Environment</h2>
            <p>
              Both students and instructors are expected to maintain an environment of Islamic Adab, mutual courtesy, and punctuality during virtual sessions.
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
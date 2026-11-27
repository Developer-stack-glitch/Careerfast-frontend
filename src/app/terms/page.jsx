import Header from '@/Header/Header';
import Footer from '@/Footer/Footer';

export const metadata = {
  title: "Terms of Service",
  description: "Review CareerFast's Terms of Service governing job seekers, students, and recruiters using careerfast.in.",
  alternates: {
    canonical: "https://www.careerfast.in/terms",
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: 2026</p>
          <p className="text-slate-600 leading-relaxed">
            By accessing or using CareerFast (careerfast.in), you agree to comply with these Terms of Service and applicable laws.
          </p>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">1. Platform Usage</h2>
            <p className="text-slate-600 leading-relaxed">
              Job seekers must provide accurate profile and resume details. Recruiters must post legitimate, non-misleading opportunities and comply with applicable hiring regulations.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">2. Accounts &amp; Security</h2>
            <p className="text-slate-600 leading-relaxed">
              You are responsible for safeguarding your account credentials and notifying us of any unauthorized access.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">3. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For questions regarding these terms, write to{" "}
              <a href="mailto:careerfastcontact@gmail.com" className="text-violet-700 underline">
                careerfastcontact@gmail.com
              </a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

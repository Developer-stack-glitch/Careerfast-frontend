import Header from '@/Header/Header';
import Footer from '@/Footer/Footer';

export const metadata = {
  title: "Privacy Policy",
  description: "Read CareerFast's Privacy Policy to understand how we collect, use, and protect your personal information and job application data.",
  alternates: {
    canonical: "https://www.careerfast.in/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: 2026</p>
          <p className="text-slate-600 leading-relaxed">
            CareerFast (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting the personal data you share when using careerfast.in and associated portals.
          </p>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">1. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed">
              We collect information you provide directly, such as your name, email address, phone number, resume, educational background, work experience, and job preferences when creating a profile or applying for opportunities.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">2. How We Use Information</h2>
            <p className="text-slate-600 leading-relaxed">
              We use your data to match you with relevant job, internship, scholarship, and course opportunities, share applications with employers you apply to, and improve platform reliability and security.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">3. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              For privacy requests or questions, contact{" "}
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

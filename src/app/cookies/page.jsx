import Header from '@/Header/Header';
import Footer from '@/Footer/Footer';

export const metadata = {
  title: "Cookie Policy",
  description: "Learn how CareerFast uses cookies and local storage to keep your session secure and personalize your job search.",
  alternates: {
    canonical: "https://careerfast.in/cookies",
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
          <p className="text-sm text-slate-500">Last updated: 2026</p>
          <p className="text-slate-600 leading-relaxed">
            CareerFast uses essential cookies, local storage, and analytics technologies to maintain login sessions, remember your preferences, and measure site performance.
          </p>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">1. Types of Cookies We Use</h2>
            <p className="text-slate-600 leading-relaxed">
              Essential cookies support authentication and security. Analytics cookies help us understand how visitors discover jobs, internships, and courses so we can improve search quality.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">2. Managing Preferences</h2>
            <p className="text-slate-600 leading-relaxed">
              You can control or clear cookies anytime through your browser settings.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

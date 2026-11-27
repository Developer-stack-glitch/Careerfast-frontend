import SupportPageComponent from '@/Support/SupportPage';

export const metadata = {
  title: "24/7 Help Center & Support",
  description: "Get 24/7 support for CareerFast accounts, job applications, recruiter verification, and billing. Raise or track a support ticket anytime.",
  alternates: { canonical: "https://www.careerfast.in/support" },
  openGraph: {
    title: "24/7 Help Center & Support | CareerFast",
    description: "Raise a support ticket, track resolution status, or browse FAQs on CareerFast.",
    url: "https://www.careerfast.in/support",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function SupportPage() {
  return <SupportPageComponent />;
}

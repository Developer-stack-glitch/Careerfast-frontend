import Courses from '@/Courses/Courses';

export const metadata = {
  title: "Online Courses - Master New Skills for Your Career",
  description: "Explore our carefully crafted online courses designed to help you master new skills and advance your career.",
  keywords: "online courses, career development, professional training, CareerFast",
  alternates: { canonical: "https://www.careerfast.in/courses" },
  openGraph: {
    title: "Online Courses - Master New Skills for Your Career | CareerFast",
    description: "Explore industry-recognized certification courses with hands-on projects on CareerFast.",
    url: "https://www.careerfast.in/courses",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <Courses />;
}

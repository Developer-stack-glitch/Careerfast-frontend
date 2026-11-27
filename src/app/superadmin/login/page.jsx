import SuperadminLogin from "@/Superadmin/SuperadminLogin";

export const metadata = {
  title: "Superadmin Sign In | Command Console - CareerFast",
  description: "Restricted administrative login portal for CareerFast Superadministrators.",
  robots: { index: false, follow: false },
};

export default function SuperadminLoginPage() {
  return <SuperadminLogin />;
}

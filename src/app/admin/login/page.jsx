import SuperadminLogin from "@/Superadmin/SuperadminLogin";

export const metadata = {
  title: "Superadmin Sign In | Command Console - CareerFast",
  description: "Restricted administrative login portal for CareerFast Superadministrators.",
};

export default function AdminLoginPage() {
  return <SuperadminLogin />;
}

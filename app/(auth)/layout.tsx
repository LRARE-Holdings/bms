import AuthCloseButton from "@/components/auth/auth-close-button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthCloseButton />
      <main className="flex-1">{children}</main>
    </>
  );
}

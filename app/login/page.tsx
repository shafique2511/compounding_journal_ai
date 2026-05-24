import { AuthCard } from "@/components/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return <AuthCard message={params?.message ?? ""} mode="login" />;
}

import { EditStrategyForm } from "@/components/strategies";

export default async function EditStrategyPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <EditStrategyForm strategyId={id} />;
}

import { StrategyDetail } from "@/components/strategies";

export default async function StrategyDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <StrategyDetail strategyId={id} />;
}

import { TradeDetail } from "@/components/journal";

export default async function JournalEntryPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <TradeDetail tradeId={id} />;
}

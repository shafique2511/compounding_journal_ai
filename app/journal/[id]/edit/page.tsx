import { EditTradeForm } from "@/components/journal/edit-trade-form";

export default async function EditJournalEntryPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <EditTradeForm tradeId={id} />;
}

import { ControlDetailPage } from "@/components/control-detail-page";

export default async function ControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ControlDetailPage id={id} />;
}

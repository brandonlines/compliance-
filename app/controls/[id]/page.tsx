import { ControlDetailPage } from "@/components/control-detail-page";
import { buildSeedStore } from "@/data/seed";

export function generateStaticParams() {
  return buildSeedStore().controls.map((control) => ({
    id: control.id
  }));
}

export default async function ControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ControlDetailPage id={id} />;
}

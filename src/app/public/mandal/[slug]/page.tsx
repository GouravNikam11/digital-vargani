import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getFinancialTotals, getActiveFestival } from "@/services/finance.service";
import { Card } from "@/components/ui/card";

export default async function PublicMandalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.publicPage.findUnique({
    where: { slug },
    include: { mandal: true },
  });
  if (!page || !page.isEnabled) notFound();

  const festival = await getActiveFestival(page.mandalId);
  const totals =
    page.showFinancialSummary && festival
      ? await getFinancialTotals({ mandalId: page.mandalId, festivalId: festival.id })
      : null;

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <Card className="space-y-3 text-center">
        <p className="text-sm text-accent">॥ श्री गणेशाय नमः ॥</p>
        <h1 className="text-2xl font-bold text-primary">{page.mandal.name}</h1>
        <p>गणपती उत्सव {page.mandal.ganpatiYear}</p>
        <p className="text-sm text-muted-foreground">
          {[page.mandal.address, page.mandal.city].filter(Boolean).join(", ")}
        </p>
        <p>{page.mandal.mobile}</p>
        {totals ? (
          <div className="grid grid-cols-3 gap-2 pt-4">
            <div>
              <p className="text-xs">एकूण वर्गणी</p>
              <p className="font-bold">{totals.collectionFormatted}</p>
            </div>
            <div>
              <p className="text-xs">एकूण खर्च</p>
              <p className="font-bold">{totals.expensesFormatted}</p>
            </div>
            <div>
              <p className="text-xs">शिल्लक</p>
              <p className="font-bold">{totals.balanceFormatted}</p>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

import { NextResponse } from "next/server";
import { computeMatches } from "@/lib/matching";
import { readConnection } from "@/lib/sheet-settings-store";
import { loadAll } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connection = await readConnection();
    const { buyers, sellers, offers } = await loadAll(connection);
    const matches = computeMatches(buyers, offers);
    return NextResponse.json({
      stats: {
        buyers: buyers.length,
        sellers: sellers.length,
        offers: offers.length,
        a: matches.filter((match) => match.priority === "A").length,
        b: matches.filter((match) => match.priority === "B").length,
        strong: matches.filter((match) => match.match >= 75).length,
      },
      buyers,
      sellers,
      offers,
      matches,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

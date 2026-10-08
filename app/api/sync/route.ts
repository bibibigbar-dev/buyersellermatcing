import { NextRequest, NextResponse } from "next/server";
import { computeMatches } from "@/lib/matching";
import { readConnection } from "@/lib/sheet-settings-store";
import { appendLog, loadAll, overwriteMatches } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const connection = await readConnection();
    const { buyers, offers } = await loadAll(connection);
    const matches = computeMatches(buyers, offers);
    const header = ["Priority", "Buyer / Company", "Name", "Email / Phone", "Buyer Wants", "BEST OFFER", "Offer Details", "Match %", "Why It Fits", "WHAT TO DO", "Alt Offer 1", "Alt Offer 2", "Buyer Score"];
    await overwriteMatches(connection, [
      header,
      ...matches.map((match) => [
        match.priority,
        match.buyerCompany,
        match.buyerName,
        match.contact,
        match.buyerWants,
        match.bestOffer,
        match.offerDetails,
        String(match.match),
        match.why,
        match.action,
        match.alt1,
        match.alt2,
        String(match.buyerScore),
      ]),
    ]);
    await appendLog(connection, [
      new Date().toISOString(),
      String(buyers.length),
      String(offers.length),
      String(matches.filter((match) => match.match >= 75).length),
      String(matches.filter((match) => match.priority === "A").length),
      "Web sync",
    ]);
    return NextResponse.json({ ok: true, buyers: buyers.length, offers: offers.length, matches: matches.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

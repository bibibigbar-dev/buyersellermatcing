import { NextResponse } from "next/server";
import { loadAll } from "@/lib/sheets";
import { clearSettings, readPublicSettings, saveSettings } from "@/lib/sheet-settings-store";
import { toConnection } from "@/lib/sheet-connection";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readPublicSettings());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      privateKey?: string;
      buyerSheetUrl?: string;
      managementSheetUrl?: string;
    };
    const settings = await saveSettings(body);
    let warning = "";
    try {
      await loadAll(toConnection(settings));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      warning = /DECODER|unsupported|invalid_grant|private key/i.test(message)
        ? "Saved the sheet links, but the private key was rejected. Paste the private_key value from the service account JSON."
        : message || "Saved, but the sheets could not be read.";
    }
    return NextResponse.json({
      email: settings.email,
      buyerSheetUrl: settings.buyerSheetUrl,
      managementSheetUrl: settings.managementSheetUrl,
      hasPrivateKey: true,
      warning,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save settings." }, { status: 400 });
  }
}

export async function DELETE() {
  await clearSettings();
  return NextResponse.json({ email: "", buyerSheetUrl: "", managementSheetUrl: "", hasPrivateKey: false });
}

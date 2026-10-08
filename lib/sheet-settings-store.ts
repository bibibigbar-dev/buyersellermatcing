import { cookies } from "next/headers";
import {
  type PublicSheetSettings,
  type SheetConnection,
  type SheetSettingsInput,
  parseSheetSettings,
  sheetUrlFromId,
  toConnection,
} from "@/lib/sheet-connection";

const metaCookie = "df_sheet_meta";
const keyCookie = "df_sheet_key";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
};

interface StoredMeta {
  email: string;
  buyerSheetUrl: string;
  managementSheetUrl: string;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function environmentSettings(): SheetSettingsInput | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() ?? "";
  const buyerId = process.env.BUYER_SPREADSHEET_ID?.trim() ?? "";
  const managementId = process.env.MANAGEMENT_SPREADSHEET_ID?.trim() ?? "";
  if (!email && !privateKey && !buyerId && !managementId) return null;
  return {
    email,
    privateKey,
    buyerSheetUrl: buyerId ? sheetUrlFromId(buyerId) : "",
    managementSheetUrl: managementId ? sheetUrlFromId(managementId) : "",
  };
}

async function readCookieSettings(): Promise<SheetSettingsInput | null> {
  const jar = await cookies();
  const metaValue = jar.get(metaCookie)?.value;
  const keyValue = jar.get(keyCookie)?.value;
  if (!metaValue && !keyValue) return null;
  try {
    const meta = metaValue ? (JSON.parse(decode(metaValue)) as StoredMeta) : { email: "", buyerSheetUrl: "", managementSheetUrl: "" };
    return {
      email: meta.email ?? "",
      buyerSheetUrl: meta.buyerSheetUrl ?? "",
      managementSheetUrl: meta.managementSheetUrl ?? "",
      privateKey: keyValue ? decode(keyValue) : "",
    };
  } catch {
    return null;
  }
}

function mergeSettings(site: SheetSettingsInput | null, environment: SheetSettingsInput | null): SheetSettingsInput | null {
  if (!site && !environment) return null;
  return {
    email: site?.email || environment?.email || "",
    privateKey: site?.privateKey || environment?.privateKey || "",
    buyerSheetUrl: site?.buyerSheetUrl || environment?.buyerSheetUrl || "",
    managementSheetUrl: site?.managementSheetUrl || environment?.managementSheetUrl || "",
  };
}

export async function readPublicSettings(): Promise<PublicSheetSettings> {
  const settings = mergeSettings(await readCookieSettings(), environmentSettings());
  return {
    email: settings?.email ?? "",
    buyerSheetUrl: settings?.buyerSheetUrl ?? "",
    managementSheetUrl: settings?.managementSheetUrl ?? "",
    hasPrivateKey: Boolean(settings?.privateKey),
  };
}

export async function readConnection(): Promise<SheetConnection> {
  const settings = mergeSettings(await readCookieSettings(), environmentSettings());
  if (!settings?.email || !settings.privateKey || !settings.buyerSheetUrl || !settings.managementSheetUrl) {
    throw new Error("Add the Google service account and both sheet links in Settings.");
  }
  return toConnection(settings);
}

export async function saveSettings(input: Partial<SheetSettingsInput>): Promise<SheetSettingsInput> {
  const existing = await readCookieSettings();
  const settings = parseSheetSettings(input, existing?.privateKey ?? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "");
  const encodedKey = encode(settings.privateKey);
  if (encodedKey.length > 3800) throw new Error("That private key is too long to store in this browser.");
  const meta: StoredMeta = {
    email: settings.email,
    buyerSheetUrl: settings.buyerSheetUrl,
    managementSheetUrl: settings.managementSheetUrl,
  };
  const jar = await cookies();
  jar.set(metaCookie, encode(JSON.stringify(meta)), cookieOptions);
  jar.set(keyCookie, encodedKey, cookieOptions);
  return settings;
}

export async function clearSettings(): Promise<void> {
  const jar = await cookies();
  jar.delete(metaCookie);
  jar.delete(keyCookie);
}

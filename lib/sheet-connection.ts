export interface SheetConnection {
  email: string;
  privateKey: string;
  buyerSpreadsheetId: string;
  managementSpreadsheetId: string;
}

export interface SheetSettingsInput {
  email: string;
  privateKey: string;
  buyerSheetUrl: string;
  managementSheetUrl: string;
}

export interface PublicSheetSettings {
  email: string;
  buyerSheetUrl: string;
  managementSheetUrl: string;
  hasPrivateKey: boolean;
}

export function spreadsheetIdFromInput(value: string): string {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) return trimmed;
  throw new Error("Enter a Google Sheets link, such as https://docs.google.com/spreadsheets/d/...");
}

export function sheetUrlFromId(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key.replace(/\\n/g, "\n").trim();
}

export function parseSheetSettings(input: Partial<SheetSettingsInput>, existingPrivateKey = ""): SheetSettingsInput {
  const email = input.email?.trim() ?? "";
  const privateKey = normalizePrivateKey(input.privateKey?.trim() || existingPrivateKey);
  const buyerSheetUrl = input.buyerSheetUrl?.trim() ?? "";
  const managementSheetUrl = input.managementSheetUrl?.trim() ?? "";
  if (!email.includes("@")) throw new Error("Enter the service account email.");
  if (!privateKey.includes("PRIVATE KEY")) throw new Error("Enter the service account private key.");
  spreadsheetIdFromInput(buyerSheetUrl);
  spreadsheetIdFromInput(managementSheetUrl);
  return { email, privateKey, buyerSheetUrl, managementSheetUrl };
}

export function toConnection(settings: SheetSettingsInput): SheetConnection {
  return {
    email: settings.email,
    privateKey: settings.privateKey,
    buyerSpreadsheetId: spreadsheetIdFromInput(settings.buyerSheetUrl),
    managementSpreadsheetId: spreadsheetIdFromInput(settings.managementSheetUrl),
  };
}

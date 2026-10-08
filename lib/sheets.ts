import { google } from "googleapis";
import type { Row } from "./matching";
import type { SheetConnection } from "./sheet-connection";

function auth(connection: SheetConnection) {
  return new google.auth.JWT({
    email: connection.email,
    key: connection.privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function rows(values: string[][] = []): Row[] {
  if (values.length < 2) return [];
  const headers = values[0];
  return values
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

async function read(connection: SheetConnection, spreadsheetId: string, range: string) {
  const sheets = google.sheets({ version: "v4", auth: auth(connection) });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (response.data.values || []) as string[][];
}

export async function loadAll(connection: SheetConnection) {
  const [buyers, sellers, offers] = await Promise.all([
    read(connection, connection.buyerSpreadsheetId, "'Form Responses 1'!A:AA"),
    read(connection, connection.managementSpreadsheetId, "'Seller Directory'!A:Q"),
    read(connection, connection.managementSpreadsheetId, "'Inventory Offers'!A:N"),
  ]);
  return { buyers: rows(buyers), sellers: rows(sellers), offers: rows(offers) };
}

export async function overwriteMatches(connection: SheetConnection, values: string[][]) {
  const sheets = google.sheets({ version: "v4", auth: auth(connection) });
  await sheets.spreadsheets.values.clear({ spreadsheetId: connection.managementSpreadsheetId, range: "'Buyer Matching'!A:M" });
  await sheets.spreadsheets.values.update({
    spreadsheetId: connection.managementSpreadsheetId,
    range: "'Buyer Matching'!A1",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function appendLog(connection: SheetConnection, values: string[]) {
  const sheets = google.sheets({ version: "v4", auth: auth(connection) });
  await sheets.spreadsheets.values.append({
    spreadsheetId: connection.managementSpreadsheetId,
    range: "'Match Log'!A:F",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

"use client";

import { useEffect, useState } from "react";

interface PublicSheetSettings {
  email: string;
  buyerSheetUrl: string;
  managementSheetUrl: string;
  hasPrivateKey: boolean;
  warning?: string;
  error?: string;
}

interface SettingsPanelProps {
  onSaved: (connected: boolean) => void;
}

export function SettingsPanel({ onSaved }: SettingsPanelProps) {
  const [email, setEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [buyerSheetUrl, setBuyerSheetUrl] = useState("");
  const [managementSheetUrl, setManagementSheetUrl] = useState("");
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: PublicSheetSettings) => {
        setEmail(data.email ?? "");
        setBuyerSheetUrl(data.buyerSheetUrl ?? "");
        setManagementSheetUrl(data.managementSheetUrl ?? "");
        setHasPrivateKey(Boolean(data.hasPrivateKey));
      })
      .catch(() => {
        setIsError(true);
        setMessage("Could not load saved settings.");
      });
  }, []);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, privateKey, buyerSheetUrl, managementSheetUrl }),
    });
    const data = (await response.json()) as PublicSheetSettings;
    setIsSaving(false);
    if (!response.ok) {
      setIsError(true);
      setMessage(data.error ?? "Could not save settings.");
      return;
    }
    setEmail(data.email ?? email);
    setBuyerSheetUrl(data.buyerSheetUrl ?? buyerSheetUrl);
    setManagementSheetUrl(data.managementSheetUrl ?? managementSheetUrl);
    setPrivateKey("");
    setHasPrivateKey(Boolean(data.hasPrivateKey));
    setIsError(Boolean(data.warning));
    setMessage(data.warning || "Saved in this browser.");
    onSaved(!data.warning);
  }

  async function removeSettings() {
    const response = await fetch("/api/settings", { method: "DELETE" });
    const data = (await response.json()) as PublicSheetSettings;
    setEmail(data.email ?? "");
    setBuyerSheetUrl(data.buyerSheetUrl ?? "");
    setManagementSheetUrl(data.managementSheetUrl ?? "");
    setPrivateKey("");
    setHasPrivateKey(Boolean(data.hasPrivateKey));
    setIsError(false);
    setMessage("Removed the connection saved in this browser.");
    onSaved(false);
  }

  return (
    <section className="panel settings">
      <h2>Connection</h2>
      <p className="settingsNote">
        Paste the service account email, its private key, and the two Google Sheet links. Share the buyer sheet as Viewer and the management sheet as Editor with that email. Values stay in this browser.
      </p>
      <form className="settingsForm" onSubmit={saveSettings}>
        <label htmlFor="service-email">
          Service account email
          <input id="service-email" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label htmlFor="service-key">
          Private key
          <textarea
            id="service-key"
            autoComplete="off"
            spellCheck={false}
            value={privateKey}
            placeholder={hasPrivateKey ? "A private key is already saved. Paste a new key only to replace it." : "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
            onChange={(event) => setPrivateKey(event.target.value)}
            required={!hasPrivateKey}
          />
        </label>
        <label htmlFor="buyer-sheet">
          Buyer sheet URL
          <input id="buyer-sheet" type="text" value={buyerSheetUrl} placeholder="https://docs.google.com/spreadsheets/d/..." onChange={(event) => setBuyerSheetUrl(event.target.value)} required />
        </label>
        <label htmlFor="management-sheet">
          Management sheet URL
          <input id="management-sheet" type="text" value={managementSheetUrl} placeholder="https://docs.google.com/spreadsheets/d/..." onChange={(event) => setManagementSheetUrl(event.target.value)} required />
        </label>
        {message ? <p className={isError ? "formError" : "formOk"}>{message}</p> : null}
        <div className="settingsActions">
          <button className="refresh" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save connection"}</button>
          <button className="secondary" type="button" onClick={() => void removeSettings()}>Remove saved connection</button>
        </div>
      </form>
    </section>
  );
}

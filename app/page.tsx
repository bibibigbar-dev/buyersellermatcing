"use client";

import { useEffect, useMemo, useState } from "react";
import { SettingsPanel } from "@/components/settings-panel";

const tabs = ["Dashboard", "Matching", "Buyers", "Sellers", "Inventory Offers", "Settings"];

interface DashboardData {
  stats: { buyers: number; sellers: number; offers: number; a: number; strong: number };
  matches: Array<Record<string, string | number>>;
  buyers: Array<Record<string, string>>;
  sellers: Array<Record<string, string>>;
  offers: Array<Record<string, string>>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");

  function load() {
    void fetch("/api/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: DashboardData & { error?: string }) => {
        if (payload.error) {
          setError(payload.error);
          setData(null);
          return;
        }
        setError("");
        setData(payload);
      })
      .catch((reason: Error) => setError(reason.message));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (error && !data) setTab("Settings");
  }, [error, data]);

  const matches = useMemo(() => {
    const needle = query.toLowerCase();
    return (data?.matches ?? []).filter(
      (row) => (priority === "All" || row.priority === priority) && (!needle || JSON.stringify(row).toLowerCase().includes(needle)),
    );
  }, [data, query, priority]);

  if (!data && !error) {
    return (
      <main className="shell">
        <div className="loading">Loading Deal Factory matching data…</div>
      </main>
    );
  }

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <span className="mark">DF</span>
          <div>
            <b>DEAL FACTORY</b>
            <small>Buyer × Seller Matching</small>
          </div>
        </div>
        <nav>
          {tabs.map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} type="button">
              {item}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <h1>{tab}</h1>
            <p>Buyer, seller and exact inventory offer management.</p>
          </div>
          <button className="refresh" onClick={load} type="button">Refresh data</button>
        </header>
        {tab === "Settings" && (
          <SettingsPanel
            onSaved={(connected) => {
              load();
              if (connected) setTab("Dashboard");
            }}
          />
        )}
        {tab !== "Settings" && error ? (
          <div className="error">
            <b>Google Sheets connection required</b>
            <p>{error}</p>
          </div>
        ) : null}
        {tab === "Dashboard" && data ? <Dashboard d={data} /> : null}
        {tab === "Matching" && data ? <Matching rows={matches} q={query} setQ={setQuery} p={priority} setP={setPriority} /> : null}
        {tab === "Buyers" && data ? <Table rows={data.buyers} q={query} setQ={setQuery} /> : null}
        {tab === "Sellers" && data ? <Table rows={data.sellers} q={query} setQ={setQuery} /> : null}
        {tab === "Inventory Offers" && data ? <Offers rows={data.offers} q={query} setQ={setQuery} /> : null}
      </main>
    </div>
  );
}

function Dashboard({ d }: { d: DashboardData }) {
  return (
    <>
      <section className="stats">
        {[["VIP Buyers", d.stats.buyers], ["Sellers", d.stats.sellers], ["Live Offers", d.stats.offers], ["A Priority", d.stats.a], ["Strong Matches", d.stats.strong]].map(([label, value]) => (
          <div className="stat" key={String(label)}>
            <small>{label}</small>
            <b>{value}</b>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>Top opportunities</h2>
        {d.matches.slice(0, 8).map((match, index) => (
          <div className="opp" key={index}>
            <span className={"badge " + match.priority}>{match.priority}</span>
            <div>
              <b>{match.buyerCompany}</b>
              <small>{match.buyerWants}</small>
              <strong>{match.bestOffer}</strong>
              <span>{match.offerDetails}</span>
            </div>
            <div className="score">
              <b>{match.match}%</b>
              <small>{match.action}</small>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function Matching({ rows, q, setQ, p, setP }: { rows: DashboardData["matches"]; q: string; setQ: (value: string) => void; p: string; setP: (value: string) => void }) {
  return (
    <section className="panel">
      <div className="toolbar">
        <input placeholder="Search buyer, offer, category..." value={q} onChange={(event) => setQ(event.target.value)} />
        <div className="pills">
          {["All", "A", "B", "C", "D"].map((item) => (
            <button className={p === item ? "on" : ""} onClick={() => setP(item)} key={item} type="button">{item}</button>
          ))}
        </div>
      </div>
      <div className="matchGrid">
        {rows.map((match, index) => (
          <article className="matchCard" key={index}>
            <div className="matchTop">
              <span className={"badge " + match.priority}>{match.priority}</span>
              <b>{match.match}% match</b>
            </div>
            <h3>{match.buyerCompany}</h3>
            <p className="muted">{match.buyerName} · {match.contact}</p>
            <label>BUYER WANTS</label>
            <p>{match.buyerWants}</p>
            <div className="best">
              <label>BEST OFFER</label>
              <b>{match.bestOffer}</b>
              <span>{match.offerDetails}</span>
            </div>
            <p className="reason">{match.why}</p>
            <div className="action">
              <label>WHAT TO DO</label>
              {match.action}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Offers({ rows, q, setQ }: { rows: Array<Record<string, string>>; q: string; setQ: (value: string) => void }) {
  const needle = q.toLowerCase();
  const filtered = rows.filter((row) => !needle || JSON.stringify(row).toLowerCase().includes(needle));
  return (
    <section className="panel">
      <div className="toolbar">
        <input placeholder="Search seller, offer..." value={q} onChange={(event) => setQ(event.target.value)} />
      </div>
      <div className="offerGrid">
        {filtered.map((offer, index) => (
          <article className="offerCard" key={index}>
            <span className="status">{offer.Status}</span>
            <h3>{offer["Inventory Offer"]}</h3>
            <p>{offer.Seller}</p>
            <dl>
              {[["Category", offer.Category], ["Unit", offer.Unit], ["Qty", offer["Qty / Load"]], ["Price", offer.Price], ["FOB", offer.FOB], ["MOQ", offer["MOQ / Restriction"]]].map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Table({ rows, q, setQ }: { rows: Array<Record<string, string>>; q: string; setQ: (value: string) => void }) {
  const needle = q.toLowerCase();
  const filtered = rows.filter((row) => !needle || JSON.stringify(row).toLowerCase().includes(needle));
  const columns = Object.keys(rows[0] || {}).slice(0, 9);
  return (
    <section className="panel">
      <div className="toolbar">
        <input placeholder="Search records" value={q} onChange={(event) => setQ(event.target.value)} />
        <span>{filtered.length} records</span>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={index}>{columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

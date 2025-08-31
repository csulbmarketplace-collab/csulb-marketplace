import React, { useEffect, useMemo, useState } from "react";

/* ---- App constants & tiny utils ---- */
const APP_NAME = "CSULB Marketplace";
const LS_USERS = "mp_users_v1";
const LS_CURRENT = "mp_current_user_v1";

type User = { email: string; password: string; createdAt: number };
type Item = {
  id: string;
  title: string;
  type: "auction" | "fixed";
  price?: number;
  endsAt?: number;
  status: "active" | "closed";
  category: string;
};

const now = () => Date.now();
const clsx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const formatCurrency = (n: number) => `$${n.toFixed(2)}`;
function timeLeft(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/* ---- localStorage helpers ---- */
function loadUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || "[]"); } catch { return []; }
}
function saveUsers(list: User[]) {
  localStorage.setItem(LS_USERS, JSON.stringify(list));
}
function loadCurrent(): User | null {
  try { return JSON.parse(localStorage.getItem(LS_CURRENT) || "null"); } catch { return null; }
}
function saveCurrent(u: User | null) {
  if (u) localStorage.setItem(LS_CURRENT, JSON.stringify(u));
  else localStorage.removeItem(LS_CURRENT);
}

/* =========================================== */

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [items] = useState<Item[]>([]); // fresh page (no demo items)
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [mode, setMode] = useState<"home" | "market">("home");
  const [tab, setTab] = useState<"auctions" | "buy" | "all">("all");

  useEffect(() => {
    const u = loadCurrent();
    if (u) setUser(u);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => i.status === "active")
      .filter((i) => (tab === "auctions" ? i.type === "auction" : tab === "buy" ? i.type === "fixed" : true))
      .filter((i) => cat === "All" || i.category === cat)
      .filter((i) => !q || i.title.toLowerCase().includes(q));
  }, [items, search, cat, tab]);

  return (
    <div className="app-root">
      <TopBar
        user={user}
        onLogout={() => { saveCurrent(null); setUser(null); setMode("home"); }}
        search={search}
        setSearch={setSearch}
        cat={cat}
        setCat={setCat}
        onHome={() => setMode("home")}
        onExplore={() => setMode("market")}
        onSignIn={() => setMode("market")}
      />

      {mode === "home" ? (
        <HomeLanding user={user} onSignIn={() => setMode("market")} onExplore={() => setMode("market")} />
      ) : !user ? (
        <AuthGate
          onLogin={(u) => { saveCurrent(u); setUser(u); }}
        />
      ) : (
        <div className="container pb-24">
          <MarketTabs active={tab} onChange={setTab} />
          <Banner />
          {filtered.length === 0 ? (
            <div className="empty">No listings yet. Be the first to post! 👀</div>
          ) : (
            <div className="grid-cards">
              {filtered.map((item) => (
                <CardItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Top Bar (with house icon that routes home) ---------- */
function TopBar({
  user, onLogout, search, setSearch, cat, setCat, onHome, onExplore, onSignIn
}: any) {
  return (
    <header className="topbar">
      <div className="container row-between">
        <button className="brand" onClick={onHome} aria-label="Home">
          <span className="brand-logo" aria-hidden>
            {/* simple house icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3.2 2.8 11a1 1 0 0 0 .6 1.8H5v6.5c0 .4.3.7.7.7H10v-5.2c0-.4.3-.8.8-.8h2.4c.4 0 .8.4.8.8V20h4.2c.4 0 .7-.3.7-.7V12.8h1.6a1 1 0 0 0 .6-1.8L12 3.2Z"/>
            </svg>
          </span>
          <span>{APP_NAME}</span>
        </button>

        {user && (
          <div className="searchbar">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" />
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {["All", "Textbooks", "Electronics", "Furniture", "Clothes", "Tickets", "Misc"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {!user ? (
            <button className="btn-primary" onClick={onSignIn}>Sign in</button>
          ) : (
            <>
              <button className="btn-primary">+ New Listing</button>
              <button className="btn" onClick={onLogout}>Log out</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Home / Hero ---------- */
function HomeLanding({ user, onSignIn, onExplore }: any) {
  return (
    <>
      <section className="hero">
        <div className="container hero-wrap">
          <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
          <p className="lead">Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.</p>
          <div className="hero-actions">
            {!user ? (
              <>
                <button className="btn-primary wide-sm" onClick={onSignIn}>Sign in</button>
                <button className="btn wide-sm" onClick={onExplore}>Explore marketplace</button>
              </>
            ) : (
              <button className="btn-primary wide-sm" onClick={onExplore}>Explore marketplace</button>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="footer-note">
          <div className="muted">🚧 Work in progress — launching soon.</div>
          <div className="feedback">Feedback</div>
          <div className="tiny muted">csulbmarketplace@gmail.com</div>
        </div>
      </div>
    </>
  );
}

/* ---------- Auth (Login / Create tabs, persistent accounts) ---------- */
function AuthGate({ onLogin }: { onLogin: (u: User) => void }) {
  const [tab, setTab] = useState<"login" | "create">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function handleLogin() {
    const users = loadUsers();
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) { setMsg("Incorrect email or password."); return; }
    setMsg(null);
    onLogin(u);
  }

  function handleCreate() {
    if (!email || !password) { setMsg("Enter email and password."); return; }
    const users = loadUsers();
    if (users.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
      setMsg("Account already exists. Try logging in.");
      return;
    }
    const u: User = { email, password, createdAt: Date.now() };
    users.push(u);
    saveUsers(users);
    setMsg("Account created! You can now log in.");
    setTab("login");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={clsx("auth-tab", tab === "login" && "on")} onClick={() => setTab("login")}>Log in</button>
          <button className={clsx("auth-tab", tab === "create" && "on")} onClick={() => setTab("create")}>Create account</button>
        </div>

        <div className="stack">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@student.csulb.edu" />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {tab === "login" ? (
            <button onClick={handleLogin} className="btn-primary btn-block">Continue</button>
          ) : (
            <button onClick={handleCreate} className="btn-primary btn-block">Create account</button>
          )}
          {msg && <div className="muted" role="status">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Market ---------- */
function MarketTabs({ active, onChange }: { active: "auctions" | "buy" | "all"; onChange: (t: "auctions" | "buy" | "all") => void; }) {
  return (
    <div className="tabs">
      <button className={clsx("tab", active === "all" && "tab-on")} onClick={() => onChange("all")}>All</button>
      <button className={clsx("tab", active === "auctions" && "tab-on")} onClick={() => onChange("auctions")}>Auctions</button>
      <button className={clsx("tab", active === "buy" && "tab-on")} onClick={() => onChange("buy")}>Buy</button>
    </div>
  );
}

function Banner() {
  return (
    <div className="banner">
      <div className="muted"><strong>Free to post</strong> until Sept 29 • Campus-only, verified @csulb.edu</div>
    </div>
  );
}

function CardItem({ item }: { item: Item }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="title">{item.title}</div>
        {item.type === "auction" ? (
          <div>Auction • Ends in {timeLeft((item.endsAt || 0) - now())}</div>
        ) : (
          <div>Buy Now • {formatCurrency(item.price || 0)}</div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";

const APP_NAME = "CSULB Marketplace";
const now = () => Date.now();

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}
function formatCurrency(n: number) { return `$${n.toFixed(2)}`; }
function timeLeft(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [items] = useState<any[]>([]); // fresh page
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [mode, setMode] = useState<"home"|"market">("home");
  const [tab, setTab] = useState<"auctions"|"buy"|"all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(i => i.status === "active")
      .filter(i => tab === "auctions" ? i.type === "auction" : tab === "buy" ? i.type === "fixed" : true)
      .filter(i => cat === "All" || i.category === cat)
      .filter(i => !q || i.title.toLowerCase().includes(q));
  }, [items, search, cat, tab]);

  return (
    <div className="app-root">
      <TopBar user={user} onLogout={()=>setUser(null)} search={search} setSearch={setSearch}
              cat={cat} setCat={setCat} onHome={()=>setMode("home")} onExplore={()=>setMode("market")}
              onSignIn={()=>setMode("market")} />
      {mode === "home" ? (
        <HomeLanding user={user} onSignIn={()=>setMode("market")} onExplore={()=>setMode("market")} />
      ) : !user ? (
        <AuthGate onLogin={(u)=>setUser(u)} />
      ) : (
        <div className="container pb-24">
          <MarketTabs active={tab} onChange={setTab} />
          <Banner />
          {filtered.length === 0 ? (
            <div className="empty">No listings yet. Be the first to post! 👀</div>
          ) : (
            <div className="grid-cards">
              {filtered.map(item => <CardItem key={item.id} item={item} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MarketTabs({ active, onChange }: { active:"auctions"|"buy"|"all"; onChange:(t:"auctions"|"buy"|"all")=>void; }) {
  return (
    <div className="tabs">
      <button className={clsx("tab", active==="all" && "tab-on")} onClick={()=>onChange("all")}>All</button>
      <button className={clsx("tab", active==="auctions" && "tab-on")} onClick={()=>onChange("auctions")}>Auctions</button>
      <button className={clsx("tab", active==="buy" && "tab-on")} onClick={()=>onChange("buy")}>Buy</button>
    </div>
  );
}

function TopBar({ user, onLogout, search, setSearch, cat, setCat, onHome, onExplore, onSignIn }: any) {
  return (
    <header className="topbar">
      <div className="container row-between">
        <button className="brand" onClick={onHome}>{APP_NAME}</button>
        {user && (
          <div className="searchbar">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search items…" />
            <select value={cat} onChange={(e)=>setCat(e.target.value)}>
              {["All","Textbooks","Electronics","Furniture","Clothes","Tickets","Misc"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div>
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

function HomeLanding({ user, onSignIn, onExplore }: any) {
  return (
    <main className="container pt-24 pb-24">
      <h1 className="h1">CSULB Marketplace</h1>
      <p className="lead mt-12">Buy & sell on campus — auctions and fixed-price listings with verified <strong>@csulb.edu</strong> sign-in.</p>
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
      <div className="footer-note">
        <div className="muted">🚧 Work in progress — launching soon.</div>
        <div className="feedback">Feedback</div>
        <div className="tiny muted">csulbauctions@gmail.com</div>
      </div>
    </main>
  );
}

function Banner(){ return (<div className="banner"><div className="badge">Campus-Only</div><div className="muted"><strong>Free to post</strong> until Sept 29.</div></div>); }
function AuthGate({ onLogin }: { onLogin:(u:any)=>void }){
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  return (<div className="container pt-24"><h2>Sign In</h2><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@student.csulb.edu" /><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" /><button onClick={()=>onLogin({email})} className="btn-primary mt-12">Continue</button></div>);
}
function CardItem({ item }: { item:any }){ return (<div className="card"><div className="card-body"><div className="title">{item.title}</div>{item.type==="auction"?<div>Auction • Ends in {timeLeft(item.endsAt - now())}</div>:<div>Buy Now • {formatCurrency(item.price)}</div>}</div></div>); }

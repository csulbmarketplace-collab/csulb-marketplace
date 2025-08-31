import React, { useMemo, useState } from "react";

/* -------------------- Helpers & Demo Data -------------------- */
type Listing = {
  id: string;
  title: string;
  category: string;
  type: "auction" | "buy";
  price: number;
  highestBid?: number;
  image: string;
  seller: string;
  endsInHrs?: number;
};

const DEMO_LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "MATH 123 Textbook (Like New)",
    category: "Textbooks",
    type: "auction",
    price: 18,
    highestBid: 18,
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    seller: "se***@student.csulb.edu",
    endsInHrs: 26,
  },
  {
    id: "l2",
    title: "Mini Fridge (Dorm Friendly)",
    category: "Dorm & Furniture",
    type: "buy",
    price: 70,
    image:
      "https://images.unsplash.com/photo-1616596872053-6d3b5a7d1b00?q=80&w=1600&auto=format&fit=crop",
    seller: "by***@student.csulb.edu",
  },
  {
    id: "l3",
    title: "Electric Scooter",
    category: "Bikes & Scooters",
    type: "auction",
    price: 110,
    highestBid: 110,
    image:
      "https://images.unsplash.com/photo-1558981033-0fceb362e2e6?q=80&w=1600&auto=format&fit=crop",
    seller: "se***@student.csulb.edu",
    endsInHrs: 5.9,
  },
  {
    id: "l4",
    title: "CSULB Hoodie (M)",
    category: "Clothing",
    type: "buy",
    price: 25,
    image:
      "https://images.unsplash.com/photo-1556909114-514a4290f9a0?q=80&w=1600&auto=format&fit=crop",
    seller: "mi***@student.csulb.edu",
  },
  {
    id: "l5",
    title: "IKEA Desk + Chair Set",
    category: "Dorm & Furniture",
    type: "auction",
    price: 62,
    highestBid: 62,
    image:
      "https://images.unsplash.com/photo-1582582494700-5d5a9e3cd908?q=80&w=1600&auto=format&fit=crop",
    seller: "ab***@student.csulb.edu",
    endsInHrs: 14,
  },
  {
    id: "l6",
    title: "TI-84 Calculator",
    category: "Electronics",
    type: "buy",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
    seller: "jo***@student.csulb.edu",
  },
];

/* -------------------- Header & Footer -------------------- */
function Header({
  onHome,
  onExplore,
  onSignIn,
  user,
  onLogout,
}: {
  onHome: () => void;
  onExplore: () => void;
  onSignIn: () => void;
  user: { email: string } | null;
  onLogout: () => void;
}) {
  return (
    <div className="topbar">
      <div className="container topbar-wrap">
        <button onClick={onHome} className="brand" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div className="brand-badge">△</div>
          CSULB Marketplace
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" onClick={onExplore}>
            Explore
          </button>
          {user ? (
            <>
              <span className="kicker small" style={{ opacity: 0.9 }}>
                {user.email}
              </span>
              <button className="btn" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <button className="btn" onClick={onSignIn}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>© {new Date().getFullYear()} CSULB Marketplace • Not affiliated with CSULB</div>
        <div style={{ display: "flex", gap: 14 }}>
          <a href="#" className="kicker">Terms</a>
          <a href="#" className="kicker">Privacy</a>
          <a href="mailto:csulbmarketplace@gmail.com" className="kicker">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* -------------------- Pages -------------------- */
function HomeLanding({ onSignIn, onExplore }: { onSignIn: () => void; onExplore: () => void }) {
  return (
    <section className="section hero">
      <div className="container">
        <div className="glass" style={{ padding: "clamp(18px,4vw,36px)" }}>
          <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
          <p className="lead">
            Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary btn-lg" onClick={onSignIn}>Sign in</button>
            <button className="btn btn-lg" onClick={onExplore}>Explore marketplace</button>
          </div>
        </div>

        <div className="section center footer-note">
          🚧 <strong>Work in progress</strong> — launching soon. <br />
          Feedback • csulbmarketplace@gmail.com
        </div>

        {/* Mobile sticky CTA */}
        <div className="stickyCta">
          <div className="stickyBar">
            <button className="btn-primary btn-block" onClick={onSignIn}>Sign in</button>
            <button className="btn btn-block" onClick={onExplore}>Explore</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthGate({
  onLogin,
  onBack,
}: {
  onLogin: (u: { email: string }) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<{ [k: string]: string }>({});
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (mode === "register") {
      if (accounts[email]) {
        setError("Account already exists");
        return;
      }
      setAccounts({ ...accounts, [email]: password });
      onLogin({ email });
    } else {
      if (accounts[email] && accounts[email] === password) {
        onLogin({ email });
      } else {
        setError("Invalid email or password");
      }
    }
  }

  // segmented underline width/position
  const indStyle: React.CSSProperties =
    mode === "login"
      ? { width: 56, transform: "translateX(6px)" }
      : { width: 128, transform: "translateX(66px)" };

  return (
    <section className="section authWrap">
      <div className="container" style={{ maxWidth: 520, padding: 0 }}>
        <button className="btn" onClick={onBack} style={{ width: "auto", padding: "8px 12px", marginBottom: 12 }}>
          ← Back to Home
        </button>
      </div>

      <div className="glass authCard">
        <div className="center">
          <div className="tabs">
            <div className="seg-indicator" style={indStyle} />
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
              Log in
            </button>
            <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
              Create account
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16 }} />
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@student.csulb.edu" />
        <div style={{ height: 12 }} />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

        {error && <div style={{ color: "#ffb4b4", marginTop: 10, fontWeight: 700 }}>{error}</div>}

        <div style={{ height: 14 }} />
        <button className="btn-primary btn-lg btn-block" onClick={submit}>
          {mode === "login" ? "Continue" : "Register"}
        </button>
        <div style={{ height: 8 }} />
        <button className="btn btn-lg btn-block" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Create one" : "Have an account? Log in"}
        </button>
      </div>
    </section>
  );
}

function ExplorePage({
  listings,
  onBackHome,
}: {
  listings: Listing[];
  onBackHome: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "auction" | "buy">("all");
  const filtered = useMemo(
    () => listings.filter((l) => (filter === "all" ? true : filter === "auction" ? l.type === "auction" : l.type === "buy")),
    [filter, listings]
  );

  return (
    <section className="section">
      <div className="container">
        <div className="toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn" onClick={onBackHome}>← Home</button>
            <h2 className="h1" style={{ fontSize: 28, margin: 0 }}>Explore</h2>
          </div>

          <div className="filterGroup">
            <button className={`badge ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`badge ${filter === "auction" ? "active" : ""}`} onClick={() => setFilter("auction")}>Auctions</button>
            <button className={`badge ${filter === "buy" ? "active" : ""}`} onClick={() => setFilter("buy")}>Buy Now</button>
          </div>
        </div>

        <div className="grid">
          {filtered.map((l) => (
            <div key={l.id} className="card">
              <img src={l.image} alt={l.title} />
              <div className="card-body">
                <div className="card-title">{l.title}</div>
                <div className="kicker">{l.category} • by {l.seller}</div>

                <div className="priceRow">
                  {l.type === "auction" ? (
                    <>
                      <div><strong>Current bid:</strong> ${l.highestBid?.toFixed(2)}</div>
                      <span className="pill auction">AUCTION {l.endsInHrs ? `• ${l.endsInHrs}h left` : ""}</span>
                    </>
                  ) : (
                    <>
                      <div><strong>Price:</strong> ${l.price.toFixed(2)}</div>
                      <span className="pill buynow">BUY NOW</span>
                    </>
                  )}
                </div>

                <div className="ctaRow">
                  {l.type === "auction" ? (
                    <>
                      <button className="btn-primary btn-block">Place bid</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-primary btn-block">Buy now</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="center mt-24 kicker">No results found.</div>
        )}
      </div>
    </section>
  );
}

/* -------------------- App Root -------------------- */
export default function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [page, setPage] = useState<"home" | "auth" | "explore">("home");

  function logout() {
    setUser(null);
    setPage("home");
  }

  return (
    <>
      <Header
        onHome={() => setPage("home")}
        onExplore={() => setPage("explore")}
        onSignIn={() => setPage("auth")}
        user={user}
        onLogout={logout}
      />

      {page === "home" && <HomeLanding onSignIn={() => setPage("auth")} onExplore={() => setPage("explore")} />}

      {page === "auth" && (
        <AuthGate
          onLogin={(u) => {
            setUser(u);
            setPage("explore");
          }}
          onBack={() => setPage("home")}
        />
      )}

      {page === "explore" && <ExplorePage listings={DEMO_LISTINGS} onBackHome={() => setPage("home")} />}

      <Footer />
    </>
  );
}

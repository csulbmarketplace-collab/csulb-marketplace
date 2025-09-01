import React, { useMemo, useState } from "react";
import { useAuth } from "./auth";
import Login from "./components/Login";

/* ---------- Header ---------- */
function Header({ goHome, goExplore, onOpenLogin }:{
  goHome:()=>void; goExplore:()=>void; onOpenLogin:()=>void;
}) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-wrap container">
        <div className="brand" role="button" onClick={goHome} aria-label="Go to home">
          <div className="brand-badge">△</div>
          <div className="brand-text">CSULB Marketplace</div>
        </div>
        <div className="top-actions row">
          <button className="btn" onClick={goExplore}>Explore</button>
          {user ? (
            <>
              <span className="me">{user.email}</span>
              <button className="btn" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="btn-primary" onClick={onOpenLogin}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Home (Hero) ---------- */
function HomeHero({ onSignIn, onExplore }:{onSignIn:()=>void; onExplore:()=>void}) {
  const { user } = useAuth();
  return (
    <section className="section">
      <div className="container">
        <div className="glass" style={{padding:"28px 20px"}}>
          <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
          <p className="lead">
            Auctions and buy-now listings, verified with <b>@student.csulb.edu</b>.
          </p>
          <div className="row">
            {!user && <button className="btn-primary btn-lg" onClick={onSignIn}>Sign in</button>}
            <button className="btn btn-lg" onClick={user ? onExplore : onSignIn}>Explore marketplace</button>
          </div>
        </div>

        <div className="center mt-16 muted">
          🚧 Work in progress — launching soon. · Feedback: csulbmarketplace@gmail.com
        </div>
      </div>
    </section>
  );
}

/* ---------- Explore (placeholder grid) ----------
   Replace the contents of <ExploreInner/> with your real Explore grid.
   The auth-gate stays here so Explore is blocked until login. */
function ExploreGate({ onNeedLogin }:{ onNeedLogin:()=>void }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <section className="section">
        <div className="container center">
          <div className="glass" style={{padding:"26px"}}>
            <div className="h1" style={{fontSize:"28px"}}>Please sign in</div>
            <p className="lead">Use your <b>@student.csulb.edu</b> email to view the marketplace.</p>
            <button className="btn-primary" onClick={onNeedLogin}>Sign in</button>
          </div>
        </div>
      </section>
    );
  }
  return <ExploreInner/>;
}

function ExploreInner(){
  // Very small sample grid so the page compiles cleanly.
  const cards = useMemo(()=>[
    { id:1, title:"MATH 123 Textbook (Like New)", meta:"Textbooks • Auction", price:"Current bid: $18.00" },
    { id:2, title:"Mini Fridge (Dorm Friendly)", meta:"Dorm & Furniture • Buy now", price:"$70.00" },
    { id:3, title:"TI-84 Calculator", meta:"Electronics • Buy now", price:"$45.00" },
  ],[]);
  return (
    <section className="section">
      <div className="container">
        <h2 className="h1" style={{fontSize:"30px", marginBottom:"14px"}}>Explore</h2>
        <div className="grid">
          {cards.map(c=>(
            <article key={c.id} className="card">
              <div className="ph">No photo</div>
              <div className="body">
                <h3>{c.title}</h3>
                <div className="meta">{c.meta}</div>
                <button className="btn btn-block">{c.price}</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer(){
  return (
    <footer className="footer">
      <div className="container footer-row">
        <div className="muted">© 2025 CSULB Marketplace · Not affiliated with CSULB · Student-made by <b>IB</b></div>
        <div className="links">
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">Terms</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</a>
          <a href="mailto:csulbmarketplace@gmail.com">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- App Shell ---------- */
export default function App(){
  const [route, setRoute] = useState<"home"|"explore">("home");
  const [showLogin, setShowLogin] = useState(false);

  const goHome = ()=>setRoute("home");
  const goExplore = ()=>setRoute("explore");

  return (
    <>
      <Header goHome={goHome} goExplore={goExplore} onOpenLogin={()=>setShowLogin(true)} />

      {route === "home" ? (
        <HomeHero onSignIn={()=>setShowLogin(true)} onExplore={goExplore} />
      ) : (
        <ExploreGate onNeedLogin={()=>setShowLogin(true)} />
      )}

      <Footer />

      {showLogin && (
        <Login
          onClose={()=>setShowLogin(false)}
          onBackHome={()=>{ setShowLogin(false); setRoute("home"); }}
        />
      )}
    </>
  );
}

import React, { useState } from "react";

/* Simple auth (same as your last version) */
function AuthGate({ onLogin }: { onLogin:(u:any)=>void }){
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<{[k:string]:string}>({});
  const [error, setError] = useState("");

  function handleSubmit(){
    if(isRegister){
      if(accounts[email]){ setError("Account already exists"); return; }
      setAccounts({...accounts, [email]:password});
      onLogin({email});
    } else {
      if(accounts[email] && accounts[email]===password){
        onLogin({email});
      } else {
        setError("Invalid credentials");
      }
    }
  }

  return (
    <section className="section auth-wrap">
      <div className="card auth">
        <h2 className="h1 center" style={{fontSize:"28px"}}>{isRegister ? "Create account" : "Log in"}</h2>
        <input className="input mt-12" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@student.csulb.edu" />
        <input className="input mt-12" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />
        {error && <div style={{color:"#ffb4b4",marginTop:8}}>{error}</div>}
        <button onClick={handleSubmit} className="btn-primary btn-lg btn-block mt-16">
          {isRegister ? "Register" : "Continue"}
        </button>
        <button className="btn btn-lg btn-block mt-12" onClick={()=>setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Log in" : "Create a new account"}
        </button>
      </div>
    </section>
  );
}

/* Home / Landing (modernized & mobile-first) */
function HomeLanding({ onSignIn, onExplore }: any){
  return (
    <>
      {/* HERO */}
      <header className="header">
        <div className="container header-wrap">
          <div className="brand">
            <div className="brand-logo">🏠</div>
            <div>CSULB Marketplace</div>
          </div>
          <button className="btn" onClick={onSignIn}>Sign in</button>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="card" style={{padding:"clamp(18px,4vw,34px)"}}>
            <h1 className="h1 center">Buy & sell on campus — safely, fast, and student-only</h1>
            <p className="lead center">Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.</p>
            <div className="center" style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
              <button className="btn-primary btn-lg" onClick={onSignIn}>Sign in</button>
              <button className="btn btn-lg" onClick={onExplore}>Explore marketplace</button>
            </div>
          </div>

          {/* Features */}
          <div className="features mt-24">
            <div className="feature">
              <div className="icon">🔒</div>
              <div className="title">Campus-only</div>
              <div className="text">Verified @csulb.edu accounts keep buyers and sellers local.</div>
            </div>
            <div className="feature">
              <div className="icon">⚡️</div>
              <div className="title">Fast listings</div>
              <div className="text">Post photos, set a price or auction timer, and publish in under a minute.</div>
            </div>
            <div className="feature">
              <div className="icon">🤝</div>
              <div className="title">Meet on campus</div>
              <div className="text">No shipping. Meet at the library or student union, quick and simple.</div>
            </div>
          </div>

          {/* How it works */}
          <div className="steps mt-24">
            <div className="step">
              <div className="badge">1</div>
              <div>
                <div className="title">Create an account</div>
                <div className="text">Use your CSULB email, then log in from any device.</div>
              </div>
            </div>
            <div className="step">
              <div className="badge">2</div>
              <div>
                <div className="title">List or bid</div>
                <div className="text">Set Buy-Now or Auction. Auctions auto-end with a winner.</div>
              </div>
            </div>
            <div className="step">
              <div className="badge">3</div>
              <div>
                <div className="title">Meet & swap</div>
                <div className="text">Coordinate a safe meetup spot on campus. Easy.</div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="footer-note section">
            🚧 <strong>Work in progress</strong> — launching soon.
            <div className="feedback">Feedback • csulbmarketplace@gmail.com</div>
          </div>

          {/* Sticky CTA for phones */}
          <div className="mobile-cta">
            <div className="bar">
              <button className="btn-primary btn-block" onClick={onSignIn}>Sign in</button>
              <button className="btn btn-block" onClick={onExplore}>Explore</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App(){
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"home"|"auth">("home");

  return mode === "home" && !user ? (
    <HomeLanding onSignIn={()=>setMode("auth")} onExplore={()=>alert("Browse as guest (demo)")} />
  ) : !user ? (
    <AuthGate onLogin={(u)=>setUser(u)} />
  ) : (
    <section className="section">
      <div className="container">
        <div className="card" style={{padding:24}}>
          <h2 className="h1" style={{fontSize:"28px"}}>Welcome, {user.email}</h2>
          <p className="lead" style={{marginTop:8}}>You’re logged in. Marketplace feed coming next.</p>
        </div>
      </div>
    </section>
  );
}

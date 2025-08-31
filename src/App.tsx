import React, { useState } from "react";

/* -------------------- Auth -------------------- */
function AuthGate({ onLogin }: { onLogin:(u:any)=>void }){
  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<{[k:string]:string}>({});
  const [error, setError] = useState("");

  function handleSubmit(){
    setError("");
    if(mode === "register"){
      if(accounts[email]){ setError("Account already exists"); return; }
      setAccounts({...accounts, [email]: password});
      onLogin({email});
    }else{
      if(accounts[email] && accounts[email] === password){
        onLogin({email});
      }else{
        setError("Invalid email or password");
      }
    }
  }

  return (
    <section className="section authWrap">
      <div className="glass authCard">
        <div className="center">
          <div className="tabs">
            <button className={`tab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")}>Log in</button>
            <button className={`tab ${mode==="register"?"active":""}`} onClick={()=>setMode("register")}>Create account</button>
          </div>
        </div>

        <div style={{marginTop:16}} />
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@student.csulb.edu" />
        <div style={{height:12}} />
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        {error && <div style={{color:"#ffb4b4", marginTop:10, fontWeight:700}}>{error}</div>}
        <div style={{height:14}} />
        <button className="btn-primary btn-lg btn-block" onClick={handleSubmit}>
          {mode === "login" ? "Continue" : "Register"}
        </button>
        <div style={{height:8}} />
        <button className="btn btn-lg btn-block" onClick={()=>setMode(mode==="login"?"register":"login")}>
          {mode === "login" ? "Need an account? Create one" : "Have an account? Log in"}
        </button>
      </div>
    </section>
  );
}

/* -------------------- Landing -------------------- */
function HomeLanding({ onSignIn, onExplore }: any){
  return (
    <>
      {/* Top bar with extra breathing room from page top */}
      <div className="topbar">
        <div className="container topbar-wrap">
          <div className="brand">
            <div className="brand-badge">🏠</div>
            CSULB Marketplace
          </div>
          <button className="btn" onClick={onSignIn}>Sign in</button>
        </div>
      </div>

      {/* Hero */}
      <section className="section">
        <div className="container">
          <div className="glass" style={{padding:"clamp(18px,4vw,36px)"}}>
            <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
            <p className="lead">Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="btn-primary btn-lg" onClick={onSignIn}>Sign in</button>
              <button className="btn btn-lg" onClick={onExplore}>Explore marketplace</button>
            </div>
          </div>

          {/* (Optional) Later: feature row + steps — left out visually for simplicity now */}

          <div className="section footer-note">
            🚧 <strong>Work in progress</strong> — launching soon. <br/>
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
    </>
  );
}

/* -------------------- App Root -------------------- */
export default function App(){
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"home"|"auth">("home");

  if (mode === "home" && !user) {
    return <HomeLanding onSignIn={()=>setMode("auth")} onExplore={()=>alert("Browse as guest (demo)")} />;
  }
  if (!user) {
    return <AuthGate onLogin={(u)=>setUser(u)} />;
  }
  return (
    <section className="section">
      <div className="container">
        <div className="glass" style={{padding:24}}>
          <h2 className="h1" style={{fontSize:28}}>Welcome, {user.email}</h2>
          <p className="lead" style={{marginTop:8}}>You’re logged in. Marketplace feed coming next.</p>
          <button className="btn mt-16" onClick={()=>{ location.reload(); }}>Log out</button>
        </div>
      </div>
    </section>
  );
}

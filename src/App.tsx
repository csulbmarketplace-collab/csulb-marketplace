import React, { useState } from "react";

function HomeLanding({ onSignIn, onExplore }: any) {
  return (
    <main className="container">
      <h1 className="h1"><span className="logo">🏠</span> CSULB Marketplace</h1>
      <p className="lead">
        Buy & sell on campus — auctions and fixed-price listings with verified <strong>@csulb.edu</strong> accounts.
      </p>
      <button className="btn-primary" onClick={onSignIn}>Sign in</button>
      <button className="btn" onClick={onExplore}>Explore marketplace</button>
      <div className="footer-note">
        🚧 Work in progress — launching soon.
        <div className="feedback">Feedback: csulbmarketplace@gmail.com</div>
      </div>
    </main>
  );
}

function AuthGate({ onLogin, onBack }: { onLogin:(u:any)=>void, onBack:()=>void }){
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
    <div className="container">
      {/* 🔙 Back to home button */}
      <button onClick={onBack} className="btn" style={{marginBottom:"1rem", width:"auto"}}>
        ← Back to Home
      </button>

      <h2 className="h1">{isRegister ? "Create Account" : "Log In"}</h2>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@student.csulb.edu" />
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />
      {error && <div style={{color:"red", marginTop:".5rem"}}>{error}</div>}
      <button onClick={handleSubmit} className="btn-primary">{isRegister ? "Register" : "Continue"}</button>
      <button className="btn" onClick={()=>setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Log in" : "Create a new account"}
      </button>
    </div>
  );
}

export default function App(){
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"home"|"auth">("home");

  return mode === "home" && !user ? (
    <HomeLanding onSignIn={()=>setMode("auth")} onExplore={()=>alert("Browse as guest (demo)!")} />
  ) : !user ? (
    <AuthGate onLogin={(u)=>setUser(u)} onBack={()=>setMode("home")} />
  ) : (
    <div className="container">
      <h2 className="h1">Welcome, {user.email}</h2>
      <p>You are now logged in! 🎉</p>
      <button className="btn" onClick={()=>setMode("home")}>Back to Home</button>
    </div>
  );
}

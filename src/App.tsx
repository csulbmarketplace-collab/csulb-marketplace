import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

/** ---------------------------
 *  Tiny hash router
 * --------------------------*/
type Route = "home" | "explore" | "auth" | "terms" | "privacy";
function useRoute(): [Route, (r: Route) => void] {
  const parse = (): Route => {
    const h = location.hash.replace("#/", "");
    return (["home","explore","auth","terms","privacy"].includes(h) ? (h as Route) : "home");
  };
  const [route, setRoute] = useState<Route>(parse());
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener("hashchange", onHash);
    if (!location.hash) location.hash = "/home";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const nav = (r: Route) => (location.hash = `/${r}`);
  return [route, nav];
}

/** ---------------------------
 *  Fake auth (localStorage)
 * --------------------------*/
const LS_USER = "cm_user";
const LS_ACCTS = "cm_accounts";
function useAuth() {
  const [user, setUser] = useState<{email:string}|null>(() => {
    try { const raw = localStorage.getItem(LS_USER); return raw ? JSON.parse(raw) : null; } catch {return null}
  });
  function login(email: string) {
    const u = {email};
    localStorage.setItem(LS_USER, JSON.stringify(u));
    setUser(u);
  }
  function logout() {
    localStorage.removeItem(LS_USER);
    setUser(null);
  }
  function register(email: string, pass: string) {
    const accts = JSON.parse(localStorage.getItem(LS_ACCTS) || "{}");
    if (accts[email]) throw new Error("Account already exists");
    accts[email] = pass;
    localStorage.setItem(LS_ACCTS, JSON.stringify(accts));
    login(email);
  }
  function check(email: string, pass: string) {
    const accts = JSON.parse(localStorage.getItem(LS_ACCTS) || "{}");
    if (!accts[email] || accts[email] !== pass) throw new Error("Invalid credentials");
    login(email);
  }
  return { user, login, logout, register, check };
}

/** ---------------------------
 *  Items store (localStorage)
 * --------------------------*/
type Item = {
  id: string;
  title: string;
  img?: string;
  type: "auction" | "buy";
  price?: string;
  bid?: string;
  timeLeft?: string;
  category: string;
  seller: string;
};
const DEMO: Item[] = [
  { id:"1", title:"MATH 123 Textbook (Like New)", img:"https://images.unsplash.com/photo-1451933335233-cf0db9c7e91f?q=80&w=1200&auto=format&fit=crop", type:"auction", bid:"$18.00", timeLeft:"26h left", category:"Textbooks", seller:"se***@student.csulb.edu" },
  { id:"2", title:"Mini Fridge (Dorm Friendly)", img:"", type:"buy", price:"$70.00", category:"Dorm & Furniture", seller:"by***@student.csulb.edu" },
  { id:"3", title:"Electric Scooter", img:"", type:"auction", bid:"$110.00", timeLeft:"5.9h left", category:"Bikes & Scooters", seller:"se***@student.csulb.edu" },
  { id:"4", title:"CSULB Hoodie (M)", img:"", type:"buy", price:"$25.00", category:"Clothing", seller:"mi***@student.csulb.edu" },
  { id:"5", title:"IKEA Desk + Chair Set", img:"", type:"auction", bid:"$62.00", timeLeft:"14h left", category:"Dorm & Furniture", seller:"ab***@student.csulb.edu" },
  { id:"6", title:"TI-84 Calculator", img:"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop", type:"buy", price:"$45.00", category:"Electronics", seller:"jo***@student.csulb.edu" },
];
const LS_ITEMS = "cm_items";
function useItems(){
  const [items, setItems] = useState<Item[]>(()=>{
    try{
      const raw = localStorage.getItem(LS_ITEMS);
      if (raw) return JSON.parse(raw);
    }catch{}
    return DEMO;
  });
  useEffect(()=>{ localStorage.setItem(LS_ITEMS, JSON.stringify(items)); },[items]);
  function add(item: Omit<Item,"id">){
    const id = String(Date.now());
    setItems(prev => [{...item, id}, ...prev]);
  }
  return {items, add};
}

/** ---------------------------
 *  UI Helpers
 * --------------------------*/
function Brand({onHome}:{onHome:()=>void}){
  return (
    <button className="brand" onClick={onHome} aria-label="Go home">
      <span className="brand-badge"><span>▲</span></span>
      CSULB Marketplace
    </button>
  );
}
function Nav({
  user, onExplore, onAuth, onLogout, onNew
}:{user:{email:string}|null,onExplore:()=>void,onAuth:()=>void,onLogout:()=>void,onNew:()=>void}){
  return (
    <div className="topbar">
      <div className="container topbar-wrap">
        <Brand onHome={()=>location.hash="/home"} />
        {/* Desktop actions */}
        <div className="nav-actions hide-mobile">
          <button className="btn" onClick={onExplore}>Explore</button>
          {user ? (
            <>
              <button className="btn btn-primary" onClick={onNew}>+ New listing</button>
              <span className="small" aria-label="Logged in email">{user.email}</span>
              <button className="btn" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onAuth}>Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** ---------------------------
 *  Pages
 * --------------------------*/
function Home({onSignIn,onExplore}:{onSignIn:()=>void,onExplore:()=>void}){
  return (
    <section className="section">
      <div className="container">
        <div className="glass hero-card">
          <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
          <p className="lead">Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.</p>
          {/* Desktop hero CTAs */}
          <div className="hide-mobile" style={{display:"flex",gap:10}}>
            <button className="btn btn-primary btn-lg" onClick={onSignIn}>Sign in</button>
            <button className="btn btn-lg" onClick={onExplore}>Explore marketplace</button>
          </div>
        </div>

        <div className="center mt-24 small">
          🔧 Work in progress — launching soon. • Feedback: <a href="mailto:csulbmarketplace@gmail.com">csulbmarketplace@gmail.com</a>
        </div>

        {/* Mobile sticky — single clean action row */}
        <div className="stickyCta show-mobile">
          <div className="container">
            <div className="stickyBar">
              <button className="btn btn-primary btn-block" onClick={onSignIn}>Sign in</button>
              <button className="btn btn-block" onClick={onExplore}>Explore</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Filters({ value, onChange }:{ value:"all"|"auction"|"buy", onChange:(v:"all"|"auction"|"buy")=>void }){
  return (
    <div className="explore-filters container">
      {(["all","auction","buy"] as const).map(v=>(
        <button
          key={v}
          className={`chip ${value===v?'active':''}`}
          aria-pressed={value===v}
          onClick={()=>onChange(v)}
        >
          {v==='all'?'All':v==='auction'?'Auctions':'Buy Now'}
        </button>
      ))}
    </div>
  );
}

function ListingCard({item}:{item:Item}){
  const primaryLabel = item.type==='auction' ? 'Place bid' : 'Buy now';
  return (
    <article className="card glass" role="article" aria-label={item.title}>
      <div className="card-media">
        {item.img ? <img src={item.img} loading="lazy" alt={item.title}/> : <div className="ph" aria-hidden/>}
      </div>
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <div className="small">{item.category} • by {item.seller}</div>
        <div className="badges mt-12">
          {item.type==='auction' && <span className="badge badge-auction">AUCTION</span>}
          {item.type==='buy'     && <span className="badge badge-buynow">BUY NOW</span>}
          {item.type==='auction' && <span className="badge badge-time">{item.timeLeft}</span>}
        </div>
        <div className="card-price">
          {item.type==='auction' ? <>Current bid: <strong>{item.bid}</strong></> : <>Price: <strong>{item.price}</strong></>}
        </div>
        <div className="card-ctas">
          <button className="btn-primary" aria-label={`${primaryLabel} for ${item.title}`}>{primaryLabel}</button>
          <button className="btn">Details</button>
        </div>
      </div>
    </article>
  );
}

function Explore({items}:{items:Item[]}){
  const [filter, setFilter] = useState<"all"|"auction"|"buy">("all");
  const filtered = useMemo(()=>items.filter(i => filter==='all' ? true : (filter==='buy' ? i.type==='buy' : i.type==='auction')), [filter, items]);
  return (
    <section className="section">
      <div className="container">
        <div style={{display:"flex",alignItems:"center",gap:10, marginBottom:10}}>
          <a className="btn" href="#/home">← Home</a>
          <h2 className="h2" style={{margin:0}}>Explore</h2>
        </div>

        <Filters value={filter} onChange={setFilter} />

        {filtered.length ? (
          <div className="cards">
            {filtered.map(i => <ListingCard key={i.id} item={i} />)}
          </div>
        ) : (
          <div className="glass" style={{padding:18}}>
            <strong>No listings yet.</strong> Be the first to post! (Demo)
          </div>
        )}
      </div>

      {/* Mobile sticky actions - only Explore */}
      <div className="stickyCta show-mobile">
        <div className="container">
          <div className="stickyBar">
            <a className="btn btn-block" href="#/home">Home</a>
            <button className="btn btn-primary btn-block">+ New listing</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Auth({ onClose, auth }:{ onClose:()=>void, auth: ReturnType<typeof useAuth> }){
  const [isReg, setIsReg] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  function submit(){
    setErr("");
    try{
      if(isReg) auth.register(email, pass);
      else auth.check(email, pass);
      onClose();
    }catch(e:any){ setErr(e.message || "Error"); }
  }

  return (
    <section className="section authWrap">
      <div className="small center" style={{marginBottom:12}}>
        <a className="btn" href="#/home">← Back to Home</a>
      </div>
      <div className="glass authCard">
        <div style={{display:"flex",gap:8, justifyContent:"center", marginBottom:12}}>
          <button className={`btn ${!isReg?'btn-primary':''}`} onClick={()=>setIsReg(false)}>Log in</button>
          <button className={`btn ${isReg?'btn-primary':''}`} onClick={()=>setIsReg(true)}>Create account</button>
        </div>
        <input className="input" placeholder="you@student.csulb.edu" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="mt-12" />
        <input className="input" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        {err && <div className="small" style={{color:"#ffb4c2", marginTop:8}}>{err}</div>}
        <div className="mt-12" />
        <button className="btn-primary btn-block" onClick={submit}>{isReg ? "Register" : "Continue"}</button>
        <div className="mt-12" />
        <button className="btn btn-block" onClick={()=>setIsReg(!isReg)}>
          {isReg ? "Already have an account? Log in" : "Need an account? Create one"}
        </button>
      </div>
    </section>
  );
}

/** ---------------------------
 *  Legal pages
 * --------------------------*/
function TermsPage(){
  return (
    <section className="section">
      <div className="container glass" style={{padding:22, maxWidth:980, marginInline:"auto"}}>
        <h2 className="h2">Terms of Use</h2>
        <p className="small">Last updated: Aug 31, 2025</p>
        <p>
          CSULB Marketplace is a student-made website operated independently by a CSULB student (<strong>IB</strong>). 
          We are <strong>not affiliated with, endorsed by, or sponsored by CSU Long Beach</strong>. By using this site,
          you agree to these Terms.
        </p>
        <ol>
          <li><strong>Eligibility.</strong> This site is intended for CSULB students. Account access may require a CSULB email.</li>
          <li><strong>No payments handled.</strong> We do not process payments or hold funds. All transactions are between users.</li>
          <li><strong>Safety.</strong> Meet in public places on campus (e.g., USU or Library). Inspect items in person. Do not share sensitive info.</li>
          <li><strong>Prohibited content.</strong> No illegal items, weapons, drugs, stolen goods, counterfeit goods, or academic dishonesty services.</li>
          <li><strong>User content.</strong> You are responsible for the accuracy of your listings. We may remove content that violates these Terms.</li>
          <li><strong>Disclaimer.</strong> The service is provided “as is” without warranties. We do not guarantee availability, quality, or safety of items or users.</li>
          <li><strong>Limitation of liability.</strong> To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, or any loss arising from transactions between users.</li>
          <li><strong>Indemnity.</strong> You agree to indemnify and hold us harmless from claims arising out of your use, listings, or violations of these Terms.</li>
          <li><strong>Enforcement & takedown.</strong> We may suspend accounts, remove content, or cooperate with lawful requests.</li>
          <li><strong>Governing law & venue.</strong> California law governs. Any disputes shall be resolved in Los Angeles County, CA.</li>
          <li><strong>Changes.</strong> We may update these Terms; continued use constitutes acceptance.</li>
          <li><strong>Contact.</strong> csulbmarketplace@gmail.com</li>
        </ol>
        <div className="mt-16" />
        <a className="btn" href="#/home">← Back</a>
      </div>
    </section>
  );
}

function PrivacyPage(){
  return (
    <section className="section">
      <div className="container glass" style={{padding:22, maxWidth:980, marginInline:"auto"}}>
        <h2 className="h2">Privacy Policy</h2>
        <p className="small">Last updated: Aug 31, 2025</p>
        <p>
          This site collects the minimum information needed to operate (e.g., your email for account access). 
          We store basic account data in your browser and our site storage. We do not sell your data.
        </p>
        <ul>
          <li><strong>Account data.</strong> Email and a hashed password (for the real launch; demo stores locally). You may request deletion.</li>
          <li><strong>Usage.</strong> We may collect non-identifying analytics (e.g., page views) to improve the site.</li>
          <li><strong>Security.</strong> No system is 100% secure. Do not reuse passwords. Report issues to csulbmarketplace@gmail.com.</li>
          <li><strong>Third-party links.</strong> External sites have their own policies; we are not responsible for them.</li>
          <li><strong>Children.</strong> This site is intended for university-age users.</li>
          <li><strong>Changes.</strong> We may update this policy; continued use constitutes acceptance.</li>
        </ul>
        <p className="small">Student-made website by <strong>IB</strong>. Not affiliated with CSULB.</p>
        <div className="mt-16" />
        <a className="btn" href="#/home">← Back</a>
      </div>
    </section>
  );
}

/** ---------------------------
 *  New Listing (modal)
 * --------------------------*/
function NewListingModal({
  onClose, onCreate, seller
}:{onClose:()=>void,onCreate:(i:Omit<Item,"id">)=>void,seller:string}){
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"auction"|"buy">("auction");
  const [price, setPrice] = useState("");
  const [bid, setBid] = useState("");
  const [timeLeft, setTimeLeft] = useState("24h left");
  const [category, setCategory] = useState("Misc");
  const [img, setImg] = useState("");

  function submit(){
    if(!title.trim()) return alert("Add a title");
    if(type==="buy" && !price) return alert("Add a price");
    if(type==="auction" && !bid) return alert("Add a starting bid");
    onCreate({
      title: title.trim(),
      type,
      price: type==="buy" ? `$${Number(price).toFixed(2)}` : undefined,
      bid:   type==="auction" ? `$${Number(bid).toFixed(2)}`   : undefined,
      timeLeft: type==="auction" ? timeLeft : undefined,
      category,
      img,
      seller
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", marginBottom:8}}>
          <h3 className="h2" style={{margin:0}}>New listing</h3>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-grid">
          <div>
            <label className="small">Title</label>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., CSULB hoodie (M)" />
          </div>
          <div>
            <label className="small">Category</label>
            <input className="input" value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g., Clothing" />
          </div>
          <div>
            <label className="small">Type</label>
            <div style={{display:"flex",gap:8}}>
              <button className={`btn ${type==='auction'?'btn-primary':''}`} onClick={()=>setType("auction")}>Auction</button>
              <button className={`btn ${type==='buy'?'btn-primary':''}`} onClick={()=>setType("buy")}>Buy now</button>
            </div>
          </div>
          {type==="buy" ? (
            <div>
              <label className="small">Price (USD)</label>
              <input className="input" type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <label className="small">Starting bid (USD)</label>
                <input className="input" type="number" min="0" step="0.01" value={bid} onChange={e=>setBid(e.target.value)} />
              </div>
              <div>
                <label className="small">Duration</label>
                <input className="input" value={timeLeft} onChange={e=>setTimeLeft(e.target.value)} placeholder="24h left" />
              </div>
            </>
          )}
          <div className="modal-grid" style={{gridTemplateColumns:"1fr"}}>
            <label className="small">Photo URL (optional)</label>
            <input className="input" value={img} onChange={e=>setImg(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="mt-16" />
        <div style={{display:"flex",gap:10, justifyContent:"flex-end"}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Publish</button>
        </div>
      </div>
    </div>
  );
}

/** ---------------------------
 *  Footer
 * --------------------------*/
function Footer(){
  return (
    <footer className="footer">
      <div className="container" style={{display:"flex",justifyContent:"center",gap:18,flexWrap:"wrap"}}>
        <span>© 2025 CSULB Marketplace • Not affiliated with CSULB • Student-made by <strong>IB</strong></span>
        <a href="#/terms">Terms</a>
        <a href="#/privacy">Privacy</a>
        <a href="mailto:csulbmarketplace@gmail.com">Contact</a>
      </div>
    </footer>
  );
}

/** ---------------------------
 *  App
 * --------------------------*/
export default function App(){
  const [route, nav] = useRoute();
  const auth = useAuth();
  const {items, add} = useItems();
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <Nav
        user={auth.user}
        onExplore={()=>nav("explore")}
        onAuth={()=>nav("auth")}
        onLogout={auth.logout}
        onNew={()=>auth.user ? setShowNew(true) : nav("auth")}
      />

      {route==="home"    && <Home onSignIn={()=>nav("auth")} onExplore={()=>nav("explore")} />}
      {route==="explore" && <Explore items={items} />}
      {route==="auth"    && <Auth onClose={()=>nav("home")} auth={auth} />}
      {route==="terms"   && <TermsPage />}
      {route==="privacy" && <PrivacyPage />}

      <div className="container center small mt-24">
        🔒 Be smart & safe: meet in public areas on campus (USU / Library).
      </div>

      <Footer />

      {showNew && auth.user && (
        <NewListingModal
          seller={auth.user.email.replace(/(.{2}).+(@.*)/, (m, a, b) => a+"***"+b)}
          onClose={()=>setShowNew(false)}
          onCreate={add}
        />
      )}
    </>
  );
}

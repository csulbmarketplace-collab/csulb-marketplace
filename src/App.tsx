import React, { useMemo, useRef, useState } from "react";

/* ------------------ Types ------------------ */
type ListingType = "auction" | "buy";
type Category =
  | "Textbooks"
  | "Clothing"
  | "Electronics"
  | "Dorm & Furniture"
  | "Bikes & Scooters"
  | "Tickets"
  | "Services"
  | "Housing"
  | "Other";

type HousingKind = "Studio" | "1BR" | "2BR" | "3BR+" | "Room (Private)" | "Room (Shared)";
type BathKind = "Private Bath" | "Shared Bath";
type RoommateIntent = "Looking for roommates" | "Private place" | "Either";

type Item = {
  id: string;
  title: string;
  category: Category;
  type: ListingType;
  price?: number;
  currentBid?: number;
  endsAt?: number;
  sellerMasked?: string;
  images?: string[];
  sold?: boolean;
  housing?: {
    rent: number; kind: HousingKind; bath: BathKind; roommate: RoommateIntent; link?: string;
  };
};

type Account = { email: string; password: string };

/* ------------------ Constants / Keys ------------------ */
const CATEGORIES: Category[] = [
  "Textbooks","Clothing","Electronics","Dorm & Furniture","Bikes & Scooters","Tickets","Services","Housing","Other",
];
const MAX_IMAGES = 8;
const MAX_MB = 5;

const LS_ITEMS = "items-v2";
const LS_ACCOUNTS = "acc-v1";
const LS_SESSION = "session-v1";

/* ------------------ Utilities ------------------ */
function maskEmail(e?: string) {
  if (!e) return "";
  const [u, d] = e.split("@");
  return (u.slice(0, 2) + "***@" + d) as string;
}
function formatCurrency(n?: number) { return n == null ? "-" : `$${n.toFixed(2)}`; }
function timeLeft(ms?: number) {
  if (!ms) return "-";
  const left = ms - Date.now();
  if (left <= 0) return "Ended";
  const h = Math.floor(left / (1000 * 60 * 60));
  const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m`;
}
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/* ------------------ Initial Items ------------------ */
const initialItems: Item[] = [
  {
    id: "t-1",
    title: "MATH 123 Textbook (Like New)",
    category: "Textbooks",
    type: "auction",
    currentBid: 18,
    endsAt: Date.now() + 1000 * 60 * 60 * 26,
    images: ["https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"],
    sellerMasked: "se***@student.csulb.edu",
  },
  {
    id: "d-1",
    title: "Mini Fridge (Dorm Friendly)",
    category: "Dorm & Furniture",
    type: "buy",
    price: 70,
    images: ["https://images.unsplash.com/photo-1519710880211-3d7703f3e4a2?q=80&w=1200&auto=format&fit=crop"],
    sellerMasked: "by***@student.csulb.edu",
  },
  {
    id: "b-1",
    title: "Electric Scooter",
    category: "Bikes & Scooters",
    type: "auction",
    currentBid: 110,
    endsAt: Date.now() + 1000 * 60 * 60 * 5.5,
    images: ["https://images.unsplash.com/photo-1549921296-3a6b3b5b3e46?q=80&w=1200&auto=format&fit=crop"],
    sellerMasked: "se***@student.csulb.edu",
  },
];

/* ------------------ App ------------------ */
export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    const fromLS = localStorage.getItem(LS_ITEMS);
    const parsed: Item[] = fromLS ? JSON.parse(fromLS) : initialItems;
    return parsed.map(i => ({...i, images: i.images ?? []}));
  });

  const [activeTab, setActiveTab] = useState<"home"|"explore"|"auth">("home");
  const [showModal, setShowModal] = useState(false);
  const [session, setSession] = useState<string | null>(() => localStorage.getItem(LS_SESSION));

  // filters
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [housingKind, setHousingKind] = useState<HousingKind | "Any">("Any");
  const [bathKind, setBathKind] = useState<BathKind | "Any">("Any");
  const [roommateIntent, setRoommateIntent] = useState<RoommateIntent | "Any">("Any");

  function persist(newItems: Item[]) {
    setItems(newItems);
    localStorage.setItem(LS_ITEMS, JSON.stringify(newItems));
  }

  const filtered = useMemo(() => {
    let list = [...items];
    if (categoryFilter !== "All") list = list.filter(i => i.category === categoryFilter);
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    if (min != null) list = list.filter(i => (i.type==="buy" ? (i.price ?? Infinity) >= min : (i.currentBid ?? Infinity) >= min));
    if (max != null) list = list.filter(i => (i.type==="buy" ? (i.price ?? -Infinity) <= max : (i.currentBid ?? -Infinity) <= max));
    if (categoryFilter === "Housing") {
      list = list.filter(i => i.category === "Housing");
      if (housingKind !== "Any") list = list.filter(i => i.housing?.kind === housingKind);
      if (bathKind !== "Any") list = list.filter(i => i.housing?.bath === bathKind);
      if (roommateIntent !== "Any") list = list.filter(i => i.housing?.roommate === roommateIntent);
    }
    return list;
  }, [items, categoryFilter, minPrice, maxPrice, housingKind, bathKind, roommateIntent]);

  function logout() { localStorage.removeItem(LS_SESSION); setSession(null); }

  // Gate explore if not logged in
  const goExplore = () => { session ? setActiveTab("explore") : setActiveTab("auth"); };

  return (
    <>
      <Topbar
        loggedInEmail={session || undefined}
        onGoHome={() => setActiveTab("home")}
        onExplore={goExplore}
        onSign={() => setActiveTab("auth")}
        onLogout={logout}
      />

      {activeTab === "home" && (
        <Home heroAction={() => setActiveTab("auth")} explore={goExplore} />
      )}

      {activeTab === "explore" && session && (
        <div className="container section">
          <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
            <button className="pill" onClick={() => setActiveTab("home")}>← Home</button>
            <h2 style={{margin:0}}>Explore</h2>
            <div style={{flex:1}} />
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Listing</button>
          </div>

          <Filters
            category={categoryFilter}
            setCategory={setCategoryFilter}
            minPrice={minPrice} setMinPrice={setMinPrice}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            housingShown={categoryFilter === "Housing"}
            housingKind={housingKind} setHousingKind={setHousingKind}
            bathKind={bathKind} setBathKind={setBathKind}
            roommateIntent={roommateIntent} setRoommateIntent={setRoommateIntent}
          />

          <div className="row cards">
            {filtered.map(item => (
              <Card
                key={item.id}
                item={item}
                onBid={(amount) => {
                  setItems(prev => {
                    const next = prev.map(it => it.id===item.id ? {...it, currentBid: amount} : it);
                    localStorage.setItem(LS_ITEMS, JSON.stringify(next));
                    return next;
                  });
                }}
                onBuy={()=>{
                  setItems(prev => {
                    const next = prev.map(it => it.id===item.id ? {...it, sold:true} : it);
                    localStorage.setItem(LS_ITEMS, JSON.stringify(next));
                    return next;
                  });
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="glass" style={{padding:18, gridColumn:"1/-1", textAlign:"center", color:"var(--muted)"}}>
                Nothing here yet. Try widening your filters.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "auth" && (
        <AuthScreen
          onBack={() => setActiveTab("home")}
          onSignedIn={(email) => { localStorage.setItem(LS_SESSION, email); setSession(email); setActiveTab("home"); }}
        />
      )}

      <Footer />

      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal" role="dialog" aria-modal="true">
            <NewListingModal
              onClose={() => setShowModal(false)}
              onPublish={(newItem) => { persist([newItem, ...items]); setShowModal(false); }}
              sessionEmail={session || undefined}
            />
          </div>
        </>
      )}
    </>
  );
}

/* ------------------ Topbar / Home / Footer ------------------ */
function Topbar({
  loggedInEmail, onGoHome, onExplore, onSign, onLogout
}:{
  loggedInEmail?: string; onGoHome:()=>void; onExplore:()=>void; onSign:()=>void; onLogout:()=>void;
}) {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="brand" onClick={onGoHome}>
          <div className="mark">△</div>
          <div className="name">CSULB Marketplace</div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button className="pill" onClick={onExplore}>Explore</button>
          {loggedInEmail ? (
            <>
              <span style={{color:"var(--muted)", fontSize:14}}>{loggedInEmail}</span>
              <button className="pill" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <button className="pill" onClick={onSign}>Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Home({ heroAction, explore }: { heroAction: ()=>void; explore:()=>void }) {
  return (
    <div className="container section">
      <div className="glass hero">
        <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
        <p className="lead">Auctions and buy-now listings, verified with <strong>@student.csulb.edu</strong>.</p>
        <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={heroAction}>Sign in</button>
          <button className="btn" onClick={explore}>Explore marketplace</button>
        </div>
      </div>
      <div style={{textAlign:"center", color:"var(--muted)", marginTop:16}}>
        🔐 Be smart & safe: meet in public areas on campus (USU / Library).
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      <div className="container" style={{display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap"}}>
        <div>© 2025 CSULB Marketplace · Not affiliated with CSULB · Student-made by <strong>IB</strong></div>
        <a href="#" onClick={(e)=>{e.preventDefault(); alert(TERMS_TXT);}}>Terms</a>
        <a href="#" onClick={(e)=>{e.preventDefault(); alert(PRIVACY_TXT);}}>Privacy</a>
        <a href="mailto:csulbmarketplace@gmail.com">Contact</a>
      </div>
    </div>
  );
}

/* ------------------ Filters ------------------ */
function Filters(props: {
  category: "All" | Category; setCategory:(c:"All"|Category)=>void;
  minPrice:string; setMinPrice:(v:string)=>void; maxPrice:string; setMaxPrice:(v:string)=>void;
  housingShown:boolean; housingKind:HousingKind|"Any"; setHousingKind:(v:HousingKind|"Any")=>void;
  bathKind:BathKind|"Any"; setBathKind:(v:BathKind|"Any")=>void;
  roommateIntent:RoommateIntent|"Any"; setRoommateIntent:(v:RoommateIntent|"Any")=>void;
}) {
  return (
    <div className="filters glass" style={{padding:12}}>
      <div className="group">
        <label>Category</label>
        <select className="select" value={props.category} onChange={e=>props.setCategory(e.target.value as any)}>
          <option value="All">All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="group">
        <label>Price</label>
        <input className="input" style={{width:110}} placeholder="min" inputMode="numeric"
               value={props.minPrice} onChange={e=>props.setMinPrice(e.target.value)} />
        <span>—</span>
        <input className="input" style={{width:110}} placeholder="max" inputMode="numeric"
               value={props.maxPrice} onChange={e=>props.setMaxPrice(e.target.value)} />
      </div>
      {props.housingShown && (
        <>
          <div className="group">
            <label>Housing</label>
            <select className="select" value={props.housingKind} onChange={e=>props.setHousingKind(e.target.value as any)}>
              {["Any","Studio","1BR","2BR","3BR+","Room (Private)","Room (Shared)"].map(v=> <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="group">
            <label>Bath</label>
            <select className="select" value={props.bathKind} onChange={e=>props.setBathKind(e.target.value as any)}>
              {["Any","Private Bath","Shared Bath"].map(v=> <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="group">
            <label>Roommates</label>
            <select className="select" value={props.roommateIntent} onChange={e=>props.setRoommateIntent(e.target.value as any)}>
              {["Any","Looking for roommates","Private place","Either"].map(v=> <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------ Cards (carousel + bid/buy) ------------------ */
function Card({
  item, onBid, onBuy
}:{ item: Item; onBid:(amount:number)=>void; onBuy:()=>void }) {
  const isAuction = item.type === "auction";
  const [idx, setIdx] = useState(0);
  const imgs = item.images ?? [];
  const cur = imgs[idx];

  // simple swipe
  let startX = 0;
  function onTouchStart(e: React.TouchEvent){ startX = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent){
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) setIdx(i => dx<0 ? Math.min(i+1, imgs.length-1) : Math.max(i-1,0));
  }

  const ended = isAuction && (!!item.endsAt && Date.now() > item.endsAt);
  const canBid = isAuction && !ended && !item.sold;
  const canBuy = item.type==="buy" && !item.sold;

  return (
    <div className="card">
      {item.sold && <div className="sold-ribbon">SOLD</div>}
      <div className="card-media" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {cur ? <img src={cur} alt="" /> : <div style={{display:"grid",placeItems:"center",height:"100%",color:"#7c8ac2"}}>No photo</div>}
        {imgs.length>1 && (
          <>
            <button className="nav-btn left"  onClick={()=>setIdx(i=>Math.max(0,i-1))}>‹</button>
            <button className="nav-btn right" onClick={()=>setIdx(i=>Math.min(imgs.length-1,i+1))}>›</button>
            <div className="badge-photos">{idx+1}/{imgs.length}</div>
          </>
        )}
      </div>
      <div className="card-body">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
          <div className="badge">{item.category}</div>
          {isAuction
            ? <div className="badge">AUCTION · {timeLeft(item.endsAt)}</div>
            : <div className="badge" style={{background:"rgba(34,197,94,.12)", borderColor:"rgba(34,197,94,.3)", color:"#a6ffbf"}}>BUY NOW</div>}
        </div>
        <h4 style={{margin:"10px 0 6px"}}>{item.title}</h4>
        <div style={{color:"var(--muted)", fontSize:14}}>{item.sellerMasked ? `by ${item.sellerMasked}` : ""}</div>
        {item.category === "Housing" && item.housing && (
          <div style={{marginTop:8, fontSize:14, color:"var(--muted)"}}>
            <strong>Rent:</strong> {formatCurrency(item.housing.rent)} · <strong>{item.housing.kind}</strong> · {item.housing.bath} · {item.housing.roommate}
          </div>
        )}
        {!isAuction && item.price!=null && <div style={{marginTop:8}}><strong>{formatCurrency(item.price)}</strong></div>}
        {isAuction && <div style={{marginTop:8}}><strong>Current bid:</strong> {formatCurrency(item.currentBid)}</div>}
      </div>
      <div className="cta-bar">
        {isAuction ? (
          <button className="btn" style={{flex:1}} disabled={!canBid}
            onClick={()=>{
              const input = prompt("Enter your bid (USD)");
              if (!input) return;
              const amt = Number(input);
              if (Number.isNaN(amt) || amt <= (item.currentBid ?? 0)) { alert("Bid must be higher than current bid."); return; }
              onBid(amt);
            }}>
            Place bid
          </button>
        ) : (
          <button className="btn-primary" style={{flex:1}} disabled={!canBuy}
            onClick={()=>{
              if (confirm("Buy this item now?")) onBuy();
            }}>
            Buy now
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------ Auth Screen ------------------ */

function readAccounts(): Account[] {
  const s = localStorage.getItem(LS_ACCOUNTS);
  return s ? JSON.parse(s) : [];
}
function saveAccounts(list: Account[]) {
  localStorage.setItem(LS_ACCOUNTS, JSON.stringify(list));
}
/* Require @student.csulb.edu */
function emailOk(e: string){ return /@student\.csulb\.edu$/i.test(e.trim()); }

function AuthScreen({ onBack, onSignedIn }:{ onBack:()=>void; onSignedIn:(email:string)=>void }) {
  const [tab, setTab] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");

  function login() {
    setErr("");
    const list = readAccounts();
    const acc = list.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!emailOk(email)) { setErr("Use your @student.csulb.edu email."); return; }
    if (!acc || acc.password !== pw) { setErr("Invalid email or password."); return; }
    onSignedIn(acc.email);
    if (!remember) { /* demo only */ }
  }

  function register() {
    setErr("");
    if (!emailOk(email)) { setErr("Use your @student.csulb.edu email."); return; }
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    const list = readAccounts();
    if (list.some(a => a.email.toLowerCase() === email.toLowerCase())) { setErr("Account already exists."); return; }
    const acc = { email: email.trim(), password: pw };
    saveAccounts([acc, ...list]);
    onSignedIn(acc.email);
  }

  return (
    <div className="auth-wrap container">
      <div style={{marginBottom:12}}><button className="pill" onClick={onBack}>← Back to Home</button></div>

      <div className="auth-sky">
        <div className="auth-bg"></div>
        <div className="auth-forest"></div>

        <div className="auth-card">
          <div className="auth-title">Login</div>

          <div className="auth-tabs">
            <button className={`pill ${tab==='login'?'active':''}`} onClick={()=>setTab("login")}>Log in</button>
            <button className={`pill ${tab==='register'?'active':''}`} onClick={()=>setTab("register")}>Create account</button>
          </div>

          <input className="input" placeholder="you@student.csulb.edu" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} />

          <div className="auth-remember">
            <label style={{display:"flex", alignItems:"center", gap:8}}>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
              Remember me
            </label>
            <span style={{opacity:.6}}>Forgot password?</span>
          </div>

          {err && <div className="auth-error">{err}</div>}

          {tab === "login" ? (
            <button className="btn-primary auth-submit" onClick={login}>Login</button>
          ) : (
            <button className="btn-primary auth-submit" onClick={register}>Register</button>
          )}

          <div className="auth-small">
            {tab === "login"
              ? <>Don’t have an account? <button className="pill" onClick={()=>setTab("register")}>Register</button></>
              : <>Already have an account? <button className="pill" onClick={()=>setTab("login")}>Log in</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ New Listing Modal (multiple photos + validation) ------------------ */
function NewListingModal({
  onClose, onPublish, sessionEmail
}:{
  onClose:()=>void; onPublish:(item:Item)=>void; sessionEmail?: string;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ListingType>("auction");
  const [category, setCategory] = useState<Category>("Textbooks");
  const [startingBid, setStartingBid] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(24);

  // housing fields
  const [rent, setRent] = useState<string>("");
  const [hKind, setHKind] = useState<HousingKind>("Room (Private)");
  const [hBath, setHBath] = useState<BathKind>("Shared Bath");
  const [hRoommate, setHRoommate] = useState<RoommateIntent>("Looking for roommates");
  const [hLink, setHLink] = useState("");

  // images
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);
  const isHousing = category === "Housing";
  const isAuction = type === "auction";

  async function onFilesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    const slice = arr.slice(0, Math.max(0, remaining));
    const valid = slice.filter(f => f.size <= MAX_MB * 1024 * 1024);
    const datas = await Promise.all(valid.map(fileToDataURL));
    setImages(prev => [...prev, ...datas]);
  }
  function removeImage(idx:number){ setImages(prev => prev.filter((_,i)=>i!==idx)); }

  // VALIDATION
  const titleOk = title.trim().length >= 3;
  const hasPhoto = images.length >= 1;
  const priceOk = !isHousing && !isAuction ? Number(price) > 0 : true;
  const bidOk = !isHousing && isAuction ? Number(startingBid) > 0 && durationHours >= 1 : true;
  const rentOk = isHousing ? Number(rent) > 0 : true;
  const canPublish = titleOk && hasPhoto && priceOk && bidOk && rentOk;

  function publish(){
    setError("");
    if (!canPublish) {
      setError("Please complete all required fields (title, photos, and price/bid or rent).");
      return;
    }
    const id = Math.random().toString(36).slice(2,9);
    const seller = sessionEmail ? maskEmail(sessionEmail) : "se***@student.csulb.edu";
    const base: Item = {
      id, title: title.trim(), category,
      type: isHousing ? "buy" : type, sellerMasked: seller, images
    };
    if (!isHousing && isAuction) {
      base.currentBid = Number(startingBid);
      base.endsAt = Date.now() + durationHours * 60 * 60 * 1000;
    } else if (!isHousing && !isAuction) {
      base.price = Number(price);
    }
    if (isHousing) {
      const rentNum = Number(rent);
      base.price = rentNum;
      base.housing = { rent: rentNum, kind: hKind, bath: hBath, roommate: hRoommate, link: hLink || undefined };
    }
    onPublish(base);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>){
    e.preventDefault(); onFilesSelected(e.dataTransfer.files);
  }

  return (
    <div className="modal-card">
      <div className="modal-head">
        <h3 style={{margin:0}}>New listing</h3>
        <button className="pill" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body">
        <div className="modal-grid">
          <div>
            <label>Title *</label>
            <input className="input" placeholder="e.g., CSULB hoodie (M)" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label>Category *</label>
            <select className="select" value={category} onChange={e=>setCategory(e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Type (disabled for housing) */}
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <div style={{fontWeight:800}}>Type</div>
          <button className="pill" onClick={()=>setType("auction")}
                  style={{background:type==="auction"?"rgba(255,255,255,.15)":""}}
                  disabled={isHousing}>Auction</button>
          <button className="pill" onClick={()=>setType("buy")}
                  style={{background:type==="buy"?"rgba(255,255,255,.15)":""}}
                  disabled={isHousing}>Buy now</button>
        </div>

        {!isHousing && (
          <div className="modal-grid">
            {isAuction ? (
              <>
                <div>
                  <label>Starting bid (USD) *</label>
                  <input className="input" inputMode="numeric" value={startingBid} onChange={e=>setStartingBid(e.target.value)} />
                </div>
                <div>
                  <label>Duration (hours)</label>
                  <input className="input" inputMode="numeric" value={durationHours}
                         onChange={e=>setDurationHours(Number(e.target.value||"0"))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>Price (USD) *</label>
                  <input className="input" inputMode="numeric" value={price} onChange={e=>setPrice(e.target.value)} />
                </div>
                <div></div>
              </>
            )}
          </div>
        )}

        {isHousing && (
          <div className="glass" style={{padding:12}}>
            <div style={{fontWeight:800, marginBottom:8}}>Housing details</div>
            <div className="modal-grid">
              <div>
                <label>Monthly Rent (USD) *</label>
                <input className="input" inputMode="numeric" value={rent} onChange={e=>setRent(e.target.value)} />
              </div>
              <div>
                <label>Type</label>
                <select className="select" value={hKind} onChange={e=>setHKind(e.target.value as HousingKind)}>
                  {["Studio","1BR","2BR","3BR+","Room (Private)","Room (Shared)"].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-grid">
              <div>
                <label>Bathroom</label>
                <select className="select" value={hBath} onChange={e=>setHBath(e.target.value as BathKind)}>
                  {["Private Bath","Shared Bath"].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Roommates</label>
                <select className="select" value={hRoommate} onChange={e=>setHRoommate(e.target.value as RoommateIntent)}>
                  {["Looking for roommates","Private place","Either"].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label>More info link (optional)</label>
              <input className="input" placeholder="https://…" value={hLink} onChange={e=>setHLink(e.target.value)} />
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="uploader" onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
          <div className="drop">
            <div>
              <strong>Photos *</strong>
              <div style={{color:"var(--muted)", fontSize:13}}>Add at least 1 image (≤ {MAX_MB}MB each). Drag & drop or choose.</div>
            </div>
            <div style={{display:"flex", gap:8}}>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="file-input"
                onChange={(e)=>onFilesSelected(e.target.files)}
                style={{display:"none"}}
              />
              <button className="pill" onClick={()=>inputRef.current?.click()}>Choose files</button>
            </div>
          </div>
          {images.length>0 && (
            <div className="thumbs">
              {images.map((src, idx)=>(
                <div className="thumb" key={idx}>
                  <img src={src} alt={`photo ${idx+1}`} />
                  <button className="rm" onClick={()=>removeImage(idx)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{color:"var(--danger)"}}>{error}</div>}
      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={!canPublish} onClick={publish}>Publish</button>
      </div>
    </div>
  );
}

/* ------------------ Legal copy ------------------ */
const TERMS_TXT = `
CSULB Marketplace — Terms of Use

1) Student-run project (not affiliated with or endorsed by CSULB).
2) You must be a current student to post or transact. You are solely responsible for your listings, communications, and meet-ups.
3) No payments handled by this site. All transactions happen off-platform at your own risk. Meet in public places on campus.
4) Prohibited: illegal items, weapons, drugs, stolen goods, impersonation, harassment.
5) We may remove content, restrict access, or terminate use at our discretion.
6) THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES. We are not liable for any damages arising out of use.
7) By using the site you agree to these terms and all posted rules.`;

const PRIVACY_TXT = `
CSULB Marketplace — Privacy Notice

- This site stores basic listing data and your demo login locally in your browser (localStorage).
- We do not sell personal data. If you email us, we will use your email only to reply to you.
- No payments are processed here. Do not share sensitive info on the site.
- You can request deletion of your messages or content by contacting csulbmarketplace@gmail.com.
- This student-run project is not affiliated with CSULB.
`;

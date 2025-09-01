import React, { useEffect, useMemo, useRef, useState } from "react";

/* ===================== Types ===================== */
type ListingType = 'auction' | 'buy';
type Listing = {
  id: string;
  title: string;
  category: string;
  price?: number;           // buy-now price
  startBid?: number;        // opening bid
  currentBid?: number;      // current highest bid
  endsAt?: number;          // epoch ms
  type: ListingType;
  images: string[];         // object URLs (demo)
  sellerEmail: string;
  createdAt: number;
};
type User = { email: string };

/* ===================== Local Storage Keys ===================== */
const LS_ACCOUNTS = "cm_accounts_v1";         // { [email]: { ph: string } }
const LS_SESSION  = "cm_session_v1";          // { email }
const LS_LISTINGS = "cm_listings_v1";         // Listing[]

/* ===================== Helpers (Accounts & Session) ===================== */
async function sha256(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const b = new Uint8Array(buf);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}
function readJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}
function writeJSON(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
}
function isStudentEmail(email: string) {
  return /@student\.csulb\.edu$/i.test(email.trim());
}

/* Accounts DB shape: { [emailLower]: { ph: string } } */
async function registerAccount(email: string, password: string): Promise<{ok:true}|{ok:false,msg:string}>{
  if (!isStudentEmail(email)) return { ok:false, msg:"Use your @student.csulb.edu email." };
  if (!password || password.length < 6) return { ok:false, msg:"Password must be 6+ characters." };
  const db = readJSON<Record<string,{ph:string}>>(LS_ACCOUNTS, {});
  const key = email.toLowerCase();
  if (db[key]) return { ok:false, msg:"Account already exists — try logging in." };
  db[key] = { ph: await sha256(password) };
  writeJSON(LS_ACCOUNTS, db);
  writeJSON(LS_SESSION, { email:key });
  return { ok:true };
}
async function loginAccount(email: string, password: string): Promise<{ok:true}|{ok:false,msg:string}>{
  if (!isStudentEmail(email)) return { ok:false, msg:"Use your @student.csulb.edu email." };
  const db = readJSON<Record<string,{ph:string}>>(LS_ACCOUNTS, {});
  const key = email.toLowerCase();
  if (!db[key]) return { ok:false, msg:"No account found — create one." };
  const ph = await sha256(password);
  if (ph !== db[key].ph) return { ok:false, msg:"Incorrect password." };
  writeJSON(LS_SESSION, { email:key });
  return { ok:true };
}
function logoutAccount(){ localStorage.removeItem(LS_SESSION); }
function getSession(): User | null { return readJSON<User|null>(LS_SESSION, null); }

/* ===================== Listings CRUD ===================== */
function getListings(): Listing[] { return readJSON<Listing[]>(LS_LISTINGS, []); }
function setListings(list: Listing[]) { writeJSON(LS_LISTINGS, list); }
function upsertListing(item: Listing) {
  const arr = getListings();
  const i = arr.findIndex(x => x.id === item.id);
  if (i >= 0) arr[i] = item; else arr.unshift(item);
  setListings(arr);
}
function deleteListing(id: string) {
  setListings(getListings().filter(x => x.id !== id));
}
function placeBid(id: string, amount: number) {
  const arr = getListings();
  const i = arr.findIndex(x => x.id === id);
  if (i < 0) return;
  const it = arr[i];
  if (it.type !== 'auction') return;
  const min = (it.currentBid ?? it.startBid ?? 0) + 1;
  if (amount >= min) {
    it.currentBid = amount;
    setListings(arr);
  }
}

/* ===================== UI Subcomponents (kept here) ===================== */
function ModalShell({ title, onClose, children }:{
  title: string; onClose: ()=>void; children: React.ReactNode;
}){
  useEffect(()=>{
    const onEsc = (e: KeyboardEvent)=>{ if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return ()=>window.removeEventListener('keydown', onEsc);
  },[onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal glass" onClick={e=>e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginModal({ onClose }:{ onClose:()=>void }){
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string| null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(){
    setErr(null); setBusy(true);
    const fn = mode === 'login' ? loginAccount : registerAccount;
    const res = await fn(email, pw);
    setBusy(false);
    if (!res.ok) setErr(res.msg); else onClose();
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={e=>e.stopPropagation()}>
        <div className="tabs">
          <button className={`tab ${mode==='login'?'active':''}`} onClick={()=>setMode('login')}>Log in</button>
          <button className={`tab ${mode==='register'?'active':''}`} onClick={()=>setMode('register')}>Create account</button>
        </div>
        <div>
          <label className="label">CSULB Email</label>
          <input className="input" type="email" inputMode="email"
                 placeholder="you@student.csulb.edu"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="label mt-12">Password</label>
          <div className="pw-wrap">
            <input className="input" type={showPw?'text':'password'} placeholder="••••••••"
                   value={pw} onChange={e=>setPw(e.target.value)} />
            <button className="pw-toggle" onClick={()=>setShowPw(s=>!s)}>{showPw?'Hide':'Show'}</button>
          </div>
          {err && <div className="err mt-12">{err}</div>}
          <button className="btn-primary btn-block mt-16" onClick={submit} disabled={busy}>
            {busy ? 'Please wait…' : (mode==='login'?'Continue':'Register')}
          </button>
          <button className="btn ghost mt-12" onClick={onClose}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}

function Carousel({ images }: { images: string[] }){
  const [i, setI] = useState(0);
  if (!images || images.length===0) return <div className="imgFallback">No photo</div>;
  const prev = (e:any)=>{ e.stopPropagation(); setI((i-1+images.length)%images.length); };
  const next = (e:any)=>{ e.stopPropagation(); setI((i+1)%images.length); };
  return (
    <div className="carousel">
      <img src={images[i]} alt="" />
      {images.length>1 && <>
        <button className="nav left" onClick={prev}>‹</button>
        <button className="nav right" onClick={next}>›</button>
      </>}
      <div className="dots">
        {images.map((_,idx)=><span key={idx} className={idx===i?'dot active':'dot'} />)}
      </div>
    </div>
  );
}

function ListingCard({
  listing, onBid, onBuy, onEdit, onDelete, isOwner
}:{
  listing: Listing;
  onBid:(l:Listing)=>void; onBuy:(l:Listing)=>void;
  onEdit:(l:Listing)=>void; onDelete:(l:Listing)=>void;
  isOwner:boolean;
}){
  const left = listing.endsAt ? Math.max(0, listing.endsAt - Date.now()) : 0;
  const hrs = listing.type==='auction' ? Math.ceil(left/36e5) : null;
  return (
    <article className="card glass">
      <Carousel images={listing.images} />
      <div className="cardBody">
        <div className="cat">{listing.category}</div>
        <div className="title">{listing.title}</div>
        <div className="meta">
          {listing.type==='auction' ? (
            <>
              <div>Current bid: ${ (listing.currentBid ?? listing.startBid ?? 0).toFixed(2) }</div>
              <div className="pill">AUCTION · {hrs}h left</div>
            </>
          ) : (
            <>
              <div>Price: ${ (listing.price ?? 0).toFixed(2) }</div>
              <div className="pill buy">BUY NOW</div>
            </>
          )}
        </div>
        <div className="row gap">
          {listing.type==='auction'
            ? <button className="btn-primary btn-block" onClick={()=>onBid(listing)}>Place bid</button>
            : <button className="btn-primary btn-block" onClick={()=>onBuy(listing)}>Buy now</button>}
        </div>
        {isOwner && (
          <div className="row gap mt-12">
            <button className="btn" onClick={()=>onEdit(listing)}>Edit</button>
            <button className="btn danger" onClick={()=>onDelete(listing)}>Delete</button>
          </div>
        )}
      </div>
    </article>
  );
}

function BidModal({ listing, onSubmit, onClose }:{
  listing: Listing; onSubmit:(amount:number)=>void; onClose:()=>void;
}){
  const [val, setVal] = useState('');
  const min = (listing.currentBid ?? listing.startBid ?? 0) + 1;
  return (
    <ModalShell title="Place bid" onClose={onClose}>
      <div className="formRow">
        <label>Minimum bid</label>
        <div className="muted">${min.toFixed(2)}</div>
      </div>
      <div className="formRow">
        <label>Your bid (USD)</label>
        <input className="input" type="number" min={min} step="1" value={val} onChange={e=>setVal(e.target.value)} />
      </div>
      <div className="row gap mt-16">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={()=>{
          const n = Number(val);
          if (!isFinite(n) || n < min) return;
          onSubmit(n); onClose();
        }}>Submit bid</button>
      </div>
    </ModalShell>
  );
}

function BuyModal({ listing, onSubmit, onClose }:{
  listing: Listing; onSubmit:()=>void; onClose:()=>void;
}){
  return (
    <ModalShell title="Confirm purchase" onClose={onClose}>
      <div className="muted">You’re buying <strong>{listing.title}</strong> for <strong>${(listing.price ?? 0).toFixed(2)}</strong>.</div>
      <div className="row gap mt-16">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={()=>{ onSubmit(); onClose(); }}>Confirm</button>
      </div>
    </ModalShell>
  );
}

const CATEGORIES = [
  'Textbooks','Dorm & Furniture','Electronics','Clothing','Bikes & Scooters',
  'Tickets','Services','Housing','Other'
];

function NewOrEditModal({
  initial, sellerEmail, onSave, onClose
}:{ initial?: Listing; sellerEmail: string; onSave:(l:Listing)=>void; onClose:()=>void }){
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<ListingType>(initial?.type ?? 'auction');
  const [category, setCategory] = useState(initial?.category ?? 'Textbooks');
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : '');
  const [startBid, setStartBid] = useState<string>(initial?.startBid ? String(initial.startBid) : '');
  const [durationHrs, setDurationHrs] = useState<string>('24');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [err, setErr] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files).slice(0,8);
    const urls = arr.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls]);
    e.target.value = '';
  }
  function removeImage(i:number){ setImages(imgs=>imgs.filter((_,idx)=>idx!==i)); }

  function save(){
    setErr('');
    if (!title.trim()) { setErr('Title is required.'); return; }
    if (!category) { setErr('Category is required.'); return; }
    if (images.length === 0) { setErr('At least one photo is required.'); return; }

    const now = Date.now();
    const id = initial?.id ?? `l_${now}`;
    const base: Listing = {
      id, title:title.trim(), category, images, sellerEmail, createdAt: now, type
    };

    if (type === 'buy') {
      const p = Number(price);
      if (!isFinite(p) || p <= 0) { setErr('Enter a valid price.'); return; }
      base.price = p;
    } else {
      const sb = Number(startBid);
      if (!isFinite(sb) || sb < 0) { setErr('Enter a valid starting bid.'); return; }
      base.startBid = sb;
      base.currentBid = initial?.currentBid ?? sb;
      const hrs = Number(durationHrs) || 24;
      base.endsAt = initial?.endsAt ?? (now + hrs*36e5);
    }
    onSave(base); onClose();
  }

  return (
    <ModalShell title={editing?'Edit listing':'New listing'} onClose={onClose}>
      <div className="grid2">
        <div>
          <label>Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., CSULB hoodie (M)" />
        </div>
        <div>
          <label>Category</label>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Type</label>
          <div className="row">
            <button className={`chip ${type==='auction'?'active':''}`} onClick={()=>setType('auction')}>Auction</button>
            <button className={`chip ${type==='buy'?'active':''}`} onClick={()=>setType('buy')}>Buy now</button>
          </div>
        </div>
        {type==='auction' ? <>
          <div>
            <label>Starting bid (USD)</label>
            <input className="input" type="number" min="0" value={startBid} onChange={e=>setStartBid(e.target.value)} />
          </div>
          <div>
            <label>Duration (hours)</label>
            <input className="input" type="number" min="1" value={durationHrs} onChange={e=>setDurationHrs(e.target.value)} />
          </div>
        </> : (
          <div>
            <label>Price (USD)</label>
            <input className="input" type="number" min="1" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>
        )}
      </div>

      <div className="mt-16">
        <label>Photos</label>
        <div className="thumbs">
          {images.map((src,i)=>(
            <div key={i} className="thumb">
              <img src={src} alt="" />
              <button className="x" onClick={()=>removeImage(i)}>✕</button>
            </div>
          ))}
          <button className="thumb add" onClick={()=>fileRef.current?.click()}>＋</button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
        </div>
        <div className="hint">Tip: multiple photos supported. On phones, you can pick from your gallery.</div>
      </div>

      {err && <div className="err mt-12">{err}</div>}

      <div className="row gap mt-16">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}>{editing?'Save changes':'Publish'}</button>
      </div>
    </ModalShell>
  );
}

/* ===================== Header / Pages ===================== */
function Header({ user, goHome, goExplore, onOpenLogin, onLogout }:{
  user: User | null; goHome:()=>void; goExplore:()=>void; onOpenLogin:()=>void; onLogout:()=>void;
}){
  return (
    <header className="topbar">
      <div className="topbar-wrap container">
        <div className="brand" onClick={goHome} role="button" aria-label="Go Home">
          <div className="brand-badge">△</div>
          <div className="brand-text">CSULB Marketplace</div>
        </div>
        <div className="top-actions row">
          <button className="btn" onClick={goExplore}>Explore</button>
          {user ? (
            <>
              <span className="me">{user.email}</span>
              <button className="btn" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <button className="btn-primary" onClick={onOpenLogin}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}

function HomeHero({ onSignIn, onExplore, loggedIn }:{
  onSignIn:()=>void; onExplore:()=>void; loggedIn:boolean;
}){
  return (
    <section className="section">
      <div className="container">
        <div className="glass" style={{padding:"28px 20px"}}>
          <h1 className="h1">Buy & sell on campus — safely, fast, and student-only</h1>
          <p className="lead">Auctions and buy-now listings, verified with <strong>@student.csulb.edu</strong>.</p>
          <div className="row">
            {!loggedIn && <button className="btn-primary btn-lg" onClick={onSignIn}>Sign in</button>}
            <button className="btn btn-lg" onClick={loggedIn ? onExplore : onSignIn}>Explore marketplace</button>
          </div>
        </div>
        <div className="center mt-16 muted">
          🚧 Work in progress — launching soon. · Feedback: csulbmarketplace@gmail.com
        </div>
      </div>
    </section>
  );
}

/* ===================== App (All in one) ===================== */
export default function App(){
  const [user, setUser] = useState<User|null>(getSession());
  const [route, setRoute] = useState<'home'|'explore'>('home');
  const [showLogin, setShowLogin] = useState(false);

  const [items, setItems] = useState<Listing[]>(getListings());
  const [filterCat, setFilterCat] = useState('All');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  const [showBid, setShowBid] = useState<Listing|null>(null);
  const [showBuy, setShowBuy] = useState<Listing|null>(null);
  const [showEditor, setShowEditor] = useState<{edit?: Listing}|null>(null);

  function refresh(){ setItems(getListings()); }
  function doLogout(){ logoutAccount(); setUser(null); setRoute('home'); }

  const filtered = useMemo(()=>{
    let arr = [...items];
    if (filterCat !== 'All') arr = arr.filter(x => x.category === filterCat);
    const lo = Number(priceMin), hi = Number(priceMax);
    if (isFinite(lo)) arr = arr.filter(x => (x.type==='buy' ? (x.price??0)>=lo : (x.currentBid??x.startBid??0)>=lo));
    if (isFinite(hi)) arr = arr.filter(x => (x.type==='buy' ? (x.price??0)<=hi : (x.currentBid??x.startBid??0)<=hi));
    return arr;
  },[items, filterCat, priceMin, priceMax]);

  useEffect(()=>{
    // restore session user object
    const u = getSession();
    setUser(u);
  },[]);

  const loggedIn = !!user;

  return (
    <>
      <Header
        user={user}
        goHome={()=>setRoute('home')}
        goExplore={()=>setRoute('explore')}
        onOpenLogin={()=>setShowLogin(true)}
        onLogout={doLogout}
      />

      {route === 'home' ? (
        <HomeHero
          onSignIn={()=>setShowLogin(true)}
          onExplore={()=>setRoute('explore')}
          loggedIn={loggedIn}
        />
      ) : (
        <section className="section">
          <div className="container">
            {!loggedIn ? (
              <div className="glass center" style={{padding:"26px"}}>
                <div className="h1" style={{fontSize:"28px"}}>Please sign in</div>
                <p className="lead">Use your <b>@student.csulb.edu</b> email to view the marketplace.</p>
                <button className="btn-primary" onClick={()=>setShowLogin(true)}>Sign in</button>
              </div>
            ) : (
              <>
                <div className="filters">
                  <select className="input" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
                    {['All', ...CATEGORIES].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input" placeholder="min" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
                  <input className="input" placeholder="max" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
                  <button className="btn" onClick={()=>{ setFilterCat('All'); setPriceMin(''); setPriceMax(''); }}>Reset</button>
                  <button className="btn-primary" onClick={()=>setShowEditor({})}>+ New Listing</button>
                </div>

                <div className="grid3 mt-16">
                  {filtered.map(l=>(
                    <ListingCard
                      key={l.id}
                      listing={l}
                      onBid={(x)=>setShowBid(x)}
                      onBuy={(x)=>setShowBuy(x)}
                      onEdit={(x)=>setShowEditor({edit:x})}
                      onDelete={(x)=>{ if (confirm('Delete this listing?')) { deleteListing(x.id); refresh(); } }}
                      isOwner={user?.email === l.sellerEmail}
                    />
                  ))}
                  {filtered.length===0 && (
                    <div className="center muted" style={{gridColumn:'1/-1', padding:'18px'}}>No listings yet. Be the first to post! 👀</div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

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

      {/* Modals */}
      {showLogin && <LoginModal onClose={()=>{
        const u = getSession(); setUser(u); setShowLogin(false);
        if (u) setRoute('explore');
      }}/>}
      {showBid && (
        <BidModal
          listing={showBid}
          onClose={()=>setShowBid(null)}
          onSubmit={(amt)=>{ placeBid(showBid.id, amt); refresh(); }}
        />
      )}
      {showBuy && (
        <BuyModal
          listing={showBuy}
          onClose={()=>setShowBuy(null)}
          onSubmit={()=> alert('Demo: meet on campus to complete purchase. (Add Stripe later)')}
        />
      )}
      {showEditor && user && (
        <NewOrEditModal
          initial={showEditor.edit}
          sellerEmail={user.email}
          onClose={()=>setShowEditor(null)}
          onSave={(l)=>{ upsertListing(l); refresh(); }}
        />
      )}
    </>
  );
}

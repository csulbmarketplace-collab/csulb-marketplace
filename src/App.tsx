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
  price?: number;           // for buy now
  currentBid?: number;      // for auction
  endsAt?: number;          // epoch millis, for auction
  sellerMasked?: string;

  // new: multiple images (data URLs)
  images?: string[];

  // legacy single image (migrated into images on load)
  image?: string;

  // optional housing details
  housing?: {
    rent: number;
    kind: HousingKind;
    bath: BathKind;
    roommate: RoommateIntent;
    link?: string;
  };
};

/* ------------------ Mock Initial Items ------------------ */
const initialItems: Item[] = [
  {
    id: "t-1",
    title: "MATH 123 Textbook (Like New)",
    category: "Textbooks",
    type: "auction",
    currentBid: 18,
    endsAt: Date.now() + 1000 * 60 * 60 * 26,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    sellerMasked: "se***@student.csulb.edu",
  },
  {
    id: "d-1",
    title: "Mini Fridge (Dorm Friendly)",
    category: "Dorm & Furniture",
    type: "buy",
    price: 70,
    image: "",
    sellerMasked: "by***@student.csulb.edu",
  },
  {
    id: "b-1",
    title: "Electric Scooter",
    category: "Bikes & Scooters",
    type: "auction",
    currentBid: 110,
    endsAt: Date.now() + 1000 * 60 * 60 * 5.5,
    image: "",
    sellerMasked: "se***@student.csulb.edu",
  },
];

/* ------------------ Constants ------------------ */
const CATEGORIES: Category[] = [
  "Textbooks","Clothing","Electronics","Dorm & Furniture","Bikes & Scooters","Tickets","Services","Housing","Other",
];
const MAX_IMAGES = 8;
const MAX_MB = 5;

/* ------------------ Utilities ------------------ */
function maskEmail(e?: string) {
  if (!e) return "";
  const [u, d] = e.split("@");
  return (u.slice(0, 2) + "***@" + d) as string;
}
function formatCurrency(n?: number) {
  if (n == null) return "-";
  return `$${n.toFixed(2)}`;
}
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

/* ------------------ App ------------------ */
export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    const fromLS = localStorage.getItem("items-v2");
    const parsed: Item[] = fromLS ? JSON.parse(fromLS) : initialItems;
    // migrate legacy single image -> images[]
    return parsed.map(i => {
      if (!i.images && i.image) return {...i, images: i.image ? [i.image] : []};
      if (!i.images) return {...i, images: []};
      return i;
    });
  });

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "auth">("home");

  // filters
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  // housing-only filters
  const [housingKind, setHousingKind] = useState<HousingKind | "Any">("Any");
  const [bathKind, setBathKind] = useState<BathKind | "Any">("Any");
  const [roommateIntent, setRoommateIntent] = useState<RoommateIntent | "Any">("Any");

  function persist(newItems: Item[]) {
    setItems(newItems);
    localStorage.setItem("items-v2", JSON.stringify(newItems));
  }

  const filtered = useMemo(() => {
    let list = [...items];

    // category
    if (categoryFilter !== "All") list = list.filter(i => i.category === categoryFilter);

    // price
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    if (min != null) {
      list = list.filter(i => (i.type === "buy" ? (i.price ?? Infinity) >= min : (i.currentBid ?? Infinity) >= min));
    }
    if (max != null) {
      list = list.filter(i => (i.type === "buy" ? (i.price ?? -Infinity) <= max : (i.currentBid ?? -Infinity) <= max));
    }

    // housing filters only when category is Housing
    if (categoryFilter === "Housing") {
      list = list.filter(i => i.category === "Housing");
      if (housingKind !== "Any") list = list.filter(i => i.housing?.kind === housingKind);
      if (bathKind !== "Any") list = list.filter(i => i.housing?.bath === bathKind);
      if (roommateIntent !== "Any") list = list.filter(i => i.housing?.roommate === roommateIntent);
    }

    return list;
  }, [items, categoryFilter, minPrice, maxPrice, housingKind, bathKind, roommateIntent]);

  return (
    <>
      <Topbar onGoHome={() => setActiveTab("home")} onExplore={() => setActiveTab("explore")} />

      {activeTab === "home" && (
        <Home heroAction={() => setActiveTab("auth")} explore={() => setActiveTab("explore")} />
      )}

      {activeTab === "explore" && (
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
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            // housing
            housingShown={categoryFilter === "Housing"}
            housingKind={housingKind}
            setHousingKind={setHousingKind}
            bathKind={bathKind}
            setBathKind={setBathKind}
            roommateIntent={roommateIntent}
            setRoommateIntent={setRoommateIntent}
          />

          <div className="row cards">
            {filtered.map(item => (
              <Card key={item.id} item={item} />
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
        <AuthCard onBack={() => setActiveTab("home")} />
      )}

      <Footer />

      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal" role="dialog" aria-modal="true">
            <NewListingModal
              onClose={() => setShowModal(false)}
              onPublish={(newItem) => {
                persist([newItem, ...items]);
                setShowModal(false);
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

/* ------------------ UI: Topbar / Hero / Footer ------------------ */
function Topbar({ onGoHome, onExplore }: { onGoHome: () => void; onExplore: () => void }) {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="brand" onClick={onGoHome} style={{cursor:"pointer"}}>
          <div className="mark">△</div>
          <div className="name">CSULB Marketplace</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="pill" onClick={onExplore}>Explore</button>
          <button className="pill" onClick={onGoHome}>Sign in</button>
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
        <p className="lead">Auctions and buy-now listings, verified with <strong>@csulb.edu</strong>.</p>
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

/* ------------------ UI: Filters ------------------ */
function Filters(props: {
  category: "All" | Category;
  setCategory: (c: "All" | Category) => void;
  minPrice: string; setMinPrice: (v:string)=>void;
  maxPrice: string; setMaxPrice: (v:string)=>void;

  housingShown: boolean;
  housingKind: HousingKind | "Any";
  setHousingKind: (k: HousingKind | "Any") => void;
  bathKind: BathKind | "Any";
  setBathKind: (k: BathKind | "Any") => void;
  roommateIntent: RoommateIntent | "Any";
  setRoommateIntent: (v: RoommateIntent | "Any") => void;
}) {
  return (
    <div className="filters glass" style={{padding:12}}>
      <div className="group">
        <label>Category</label>
        <select className="select" value={props.category} onChange={e => props.setCategory(e.target.value as any)}>
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
              {["Any","Studio","1BR","2BR","3BR+","Room (Private)","Room (Shared)"].map(v=>(
                <option key={v} value={v}>{v}</option>
              ))}
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

/* ------------------ UI: Card ------------------ */
function Card({ item }: { item: Item }) {
  const isAuction = item.type === "auction";
  const first = item.images && item.images.length > 0 ? item.images[0] : undefined;
  return (
    <div className="card">
      <div className="card-media">
        {first ? <img src={first} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <div>No photo</div>}
        {item.images && item.images.length > 1 && (
          <div className="badge-photos">{item.images.length} photos</div>
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
        <div style={{color:"var(--muted)", fontSize:14}}>
          {item.sellerMasked ? `by ${item.sellerMasked}` : ""}
        </div>

        {item.category === "Housing" && item.housing && (
          <div style={{marginTop:8, fontSize:14, color:"var(--muted)"}}>
            <strong>Rent:</strong> {formatCurrency(item.housing.rent)} · <strong>{item.housing.kind}</strong> · {item.housing.bath} · {item.housing.roommate}
          </div>
        )}
      </div>
      <div className="cta-bar">
        {isAuction ? (
          <button className="btn" style={{flex:1}}>Place bid</button>
        ) : (
          <button className="btn-primary" style={{flex:1}}>Buy now</button>
        )}
      </div>
    </div>
  );
}

/* ------------------ UI: Auth ------------------ */
function AuthCard({ onBack }: { onBack: ()=>void }) {
  const [tab, setTab] = useState<"login"|"register">("login");
  return (
    <div className="container section" style={{display:"grid", placeItems:"center"}}>
      <div style={{marginBottom:12}}>
        <button className="pill" onClick={onBack}>← Back to Home</button>
      </div>
      <div className="glass" style={{width:"min(520px, 96vw)", padding:18}}>
        <div style={{display:"flex", gap:8, marginBottom:12}}>
          <button className={"pill"} style={{background: tab==="login" ? "rgba(255,255,255,.12)" : ""}} onClick={()=>setTab("login")}>Log in</button>
          <button className={"pill"} style={{background: tab==="register" ? "rgba(255,255,255,.12)" : ""}} onClick={()=>setTab("register")}>Create account</button>
        </div>
        <input className="input" placeholder="you@student.csulb.edu" />
        <input className="input" type="password" placeholder="Password" />
        <button className="btn-primary" style={{width:"100%", marginTop:8}}>
          {tab==="login" ? "Continue" : "Register"}
        </button>
        <button className="btn" style={{width:"100%", marginTop:8}} onClick={()=>setTab(tab==="login"?"register":"login")}>
          {tab==="login" ? "Need an account? Create one" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

/* ------------------ UI: New Listing Modal (with multi-image upload) ------------------ */
function NewListingModal({
  onClose, onPublish
}:{
  onClose:()=>void;
  onPublish:(item:Item)=>void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const isAuction = type === "auction";
  const isHousing = category === "Housing";

  async function onFilesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    const slice = arr.slice(0, Math.max(0, remaining));
    const valid = slice.filter(f => f.size <= MAX_MB * 1024 * 1024);
    const datas = await Promise.all(valid.map(fileToDataURL));
    setImages(prev => [...prev, ...datas]);
  }
  function removeImage(idx:number){
    setImages(prev => prev.filter((_,i)=>i!==idx));
  }

  function publish(){
    const id = Math.random().toString(36).slice(2,9);
    const base: Item = {
      id, title: title.trim() || "Untitled",
      category,
      type: isHousing ? "buy" : type, // Housing => buy/rent style
      sellerMasked: maskEmail("se***@student.csulb.edu"),
      images
    };

    if (!isHousing && isAuction) {
      base.currentBid = Number(startingBid || 0);
      base.endsAt = Date.now() + durationHours * 60 * 60 * 1000;
    } else if (!isHousing && !isAuction) {
      base.price = Number(price || 0);
    }

    if (isHousing) {
      const rentNum = Number(rent || 0);
      base.price = rentNum;
      base.housing = {
        rent: rentNum,
        kind: hKind,
        bath: hBath,
        roommate: hRoommate,
        link: hLink || undefined,
      };
    }

    onPublish(base);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>){
    e.preventDefault();
    onFilesSelected(e.dataTransfer.files);
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
            <label>Title</label>
            <input className="input" placeholder="e.g., CSULB hoodie (M)" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>

          <div>
            <label>Category</label>
            <select className="select" value={category} onChange={e=>setCategory(e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Type selector (disabled for Housing) */}
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <div style={{fontWeight:800}}>Type</div>
          <button className="pill" onClick={()=>setType("auction")}
                  style={{background: type==="auction" ? "rgba(255,255,255,.15)" : "", opacity: isHousing? .4 : 1}}
                  disabled={isHousing}>
            Auction
          </button>
          <button className="pill" onClick={()=>setType("buy")}
                  style={{background: type==="buy" ? "rgba(255,255,255,.15)" : "", opacity: isHousing? .4 : 1}}
                  disabled={isHousing}>
            Buy now
          </button>
        </div>

        {/* Price / bid row */}
        {!isHousing && (
          <div className="modal-grid">
            {isAuction ? (
              <>
                <div>
                  <label>Starting bid (USD)</label>
                  <input className="input" inputMode="numeric" placeholder="0" value={startingBid} onChange={e=>setStartingBid(e.target.value)} />
                </div>
                <div>
                  <label>Duration (hours)</label>
                  <input className="input" inputMode="numeric" placeholder="24" value={durationHours}
                         onChange={e=>setDurationHours(Number(e.target.value||"0"))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>Price (USD)</label>
                  <input className="input" inputMode="numeric" placeholder="0" value={price} onChange={e=>setPrice(e.target.value)} />
                </div>
                <div />
              </>
            )}
          </div>
        )}

        {/* Housing section */}
        {isHousing && (
          <>
            <div className="glass" style={{padding:12}}>
              <div style={{fontWeight:800, marginBottom:8}}>Housing details</div>
              <div className="modal-grid">
                <div>
                  <label>Monthly Rent (USD)</label>
                  <input className="input" inputMode="numeric" placeholder="e.g., 950" value={rent} onChange={e=>setRent(e.target.value)} />
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
          </>
        )}

        {/* Photos */}
        <div className="uploader" onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
          <div className="drop">
            <div>
              <strong>Photos</strong>
              <div style={{color:"var(--muted)", fontSize:13}}>Add up to {MAX_IMAGES} images (≤ {MAX_MB}MB each). You can drag & drop.</div>
            </div>
            <div style={{display:"flex", gap:8}}>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
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

      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={publish}>Publish</button>
      </div>
    </div>
  );
}

/* ------------------ Legal copy (minimal) ------------------ */
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

- This site stores basic listing data in your browser (localStorage) for demo purposes.
- We do not sell personal data. If you email us, we will use your email only to reply to you.
- No payments are processed here. Do not share sensitive info on the site.
- You can request deletion of your messages or content by contacting csulbmarketplace@gmail.com.
- This student-run project is not affiliated with CSULB.
`;

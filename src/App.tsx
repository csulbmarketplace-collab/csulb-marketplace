import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { Listing, ListingType, User } from "./types";
import { loadListings, saveListings, loadSession, saveSession } from "./storage";
import Topbar from "./components/Topbar";
import Login from "./components/Login";
import NewListingModal from "./components/NewListingModal";
import ListingCard from "./components/ListingCard";
import BidBuyModal from "./components/BidBuyModal";

type Screen = "home" | "auth" | "explore";

const ALL_CATEGORIES = [
  "All",
  "Textbooks",
  "Clothing",
  "Dorm & Furniture",
  "Electronics",
  "Bikes & Scooters",
  "Tickets",
  "Housing",
  "Other",
];

export default function App() {
  const [user, setUser] = useState<User|null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [listings, setListings] = useState<Listing[]>([]);
  const [showNew, setShowNew] = useState(false);

  // filters
  const [cat, setCat] = useState("All");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // bid/buy modals
  const [active, setActive] = useState<Listing|null>(null);
  const [mode, setMode] = useState<"bid"|"buy">("bid");

  // boot
  useEffect(() => {
    setListings(loadListings());
    const sess = loadSession();
    if (sess) {
      setUser(sess);
      setScreen("explore");
    }
  }, []);

  function onLoginSuccess(email: string) {
    const u = { email, password: "" };
    setUser(u);
    saveSession(u);
    setScreen("explore");
  }

  function logout() {
    setUser(null);
    saveSession(null);
    setScreen("home");
  }

  function publish(data: {
    title: string; category: string; type: ListingType; price?: number; photos: string[];
  }) {
    const item: Listing = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      type: data.type,
      price: data.type === "buy" ? data.price : undefined,
      currentBid: data.type === "auction" ? 0 : undefined,
      photos: data.photos,
      owner: user!.email,
      createdAt: Date.now(),
    };
    const updated = [item, ...listings];
    setListings(updated);
    saveListings(updated);
    setShowNew(false);
  }

  function deleteListing(it: Listing) {
    if (it.owner !== user?.email) return;
    const updated = listings.filter((x) => x.id !== it.id);
    setListings(updated);
    saveListings(updated);
  }

  function editListing(it: Listing) {
    // Simple edit: reopen NewListing with existing (left to expand later)
    alert("Edit UI stub — to keep short. (We can wire a real edit form next.)");
  }

  function openBid(it: Listing) { setActive(it); setMode("bid"); }
  function openBuy(it: Listing) { setActive(it); setMode("buy"); }

  function submitBid(amount: number) {
    if (!active) return;
    const updated = listings.map((x) =>
      x.id === active.id ? { ...x, currentBid: Math.max(amount, x.currentBid || 0) } : x
    );
    setListings(updated);
    saveListings(updated);
    setActive(null);
  }

  function confirmBuy() {
    if (!active) return;
    alert("Purchase successful (demo).");
    setActive(null);
  }

  // Guard: block explore if not logged in
  useEffect(() => {
    if (screen === "explore" && !user) setScreen("auth");
  }, [screen, user]);

  const filtered = useMemo(() => {
    let arr = [...listings];
    if (cat !== "All") arr = arr.filter((l) => l.category === cat);
    if (minPrice) {
      const v = parseFloat(minPrice);
      arr = arr.filter((l) => (l.type === "buy" ? (l.price || 0) : (l.currentBid || 0)) >= v);
    }
    if (maxPrice) {
      const v = parseFloat(maxPrice);
      arr = arr.filter((l) => (l.type === "buy" ? (l.price || 0) : (l.currentBid || 0)) <= v);
    }
    return arr;
  }, [listings, cat, minPrice, maxPrice]);

  return (
    <div className="app">
      <Topbar
        userEmail={user?.email}
        onHome={() => setScreen("home")}
        onExplore={() => setScreen("explore")}
        onNewListing={() => setShowNew(true)}
        onLogin={() => setScreen("auth")}
        onLogout={logout}
      />

      {screen === "home" && (
        <section className="hero">
          <div className="glass hero-card">
            <h1>Buy & sell on campus — safely, fast, and student-only</h1>
            <p>Auctions and buy-now listings with verified <strong>@student.csulb.edu</strong> accounts.</p>
            {!user && (
              <div className="row">
                <button className="primary" onClick={() => setScreen("auth")}>Sign in</button>
                <button onClick={() => setScreen("auth")}>Explore marketplace</button>
              </div>
            )}
          </div>

          <div className="footer-note">
            <span>⚠️ Work in progress — launching soon.</span>
            <span>Feedback • csulbmarketplace@gmail.com</span>
            <div className="tiny">© 2025 CSULB Marketplace • Not affiliated with CSULB • Student-made by <strong>IB</strong> • <a href="#" onClick={(e)=>{e.preventDefault();alert("Terms placeholder. We'll host a page later.")}}>Terms</a> • <a href="#" onClick={(e)=>{e.preventDefault();alert("Privacy placeholder. No tracking; local-only demo data.")}}>Privacy</a> • <a href="mailto:csulbmarketplace@gmail.com">Contact</a></div>
          </div>
        </section>
      )}

      {screen === "auth" && (
        <Login onSuccess={onLoginSuccess} onBackHome={() => setScreen("home")} />
      )}

      {screen === "explore" && user && (
        <main className="container">
          <div className="filters">
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="price">
              <input
                type="number"
                placeholder="min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                inputMode="numeric"
              />
              <span>–</span>
              <input
                type="number"
                placeholder="max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="spacer" />
            <button className="pill" onClick={() => setShowNew(true)}>+ New Listing</button>
          </div>

          <div className="grid">
            {filtered.map((l) => (
              <ListingCard
                key={l.id}
                item={l}
                canModify={user?.email === l.owner}
                onBid={openBid}
                onBuy={openBuy}
                onDelete={deleteListing}
                onEdit={editListing}
              />
            ))}
            {filtered.length === 0 && (
              <div className="empty">No results. Try a different filter.</div>
            )}
          </div>
        </main>
      )}

      {showNew && user && (
        <NewListingModal
          onClose={() => setShowNew(false)}
          onPublish={publish}
        />
      )}

      {active && (
        <BidBuyModal
          listing={active}
          mode={mode}
          onClose={() => setActive(null)}
          onSubmitBid={submitBid}
          onConfirmBuy={confirmBuy}
        />
      )}
    </div>
  );
}

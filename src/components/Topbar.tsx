import React from "react";

export default function Topbar({
  userEmail,
  onHome,
  onExplore,
  onNewListing,
  onLogin,
  onLogout,
}: {
  userEmail?: string | null;
  onHome: () => void;
  onExplore: () => void;
  onNewListing: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand" role="button" onClick={onHome}>
        △ <span className="brand-text">CSULB Marketplace</span>
      </div>
      <div className="actions">
        {userEmail && <button onClick={onExplore}>Explore</button>}
        {!userEmail ? (
          <button className="pill" onClick={onLogin}>Sign in</button>
        ) : (
          <>
            <button className="pill" onClick={onNewListing}>+ New Listing</button>
            <button className="pill" onClick={onLogout}>Log out</button>
          </>
        )}
      </div>
    </header>
  );
}

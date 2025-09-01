import React, { useState } from "react";
import { Listing } from "../types";

export default function ListingCard({
  item,
  canModify,
  onBid,
  onBuy,
  onDelete,
  onEdit,
}: {
  item: Listing;
  canModify: boolean;
  onBid: (l: Listing) => void;
  onBuy: (l: Listing) => void;
  onDelete: (l: Listing) => void;
  onEdit: (l: Listing) => void;
}) {
  const [idx, setIdx] = useState(0);
  const total = item.photos.length;

  function prev() { setIdx((i) => (i - 1 + total) % total); }
  function next() { setIdx((i) => (i + 1) % total); }

  return (
    <article className="card">
      <div className="carousel">
        {total > 0 ? (
          <>
            <img src={item.photos[idx]} alt={item.title} />
            {total > 1 && (
              <>
                <button className="nav prev" onClick={prev}>‹</button>
                <button className="nav next" onClick={next}>›</button>
              </>
            )}
          </>
        ) : (
          <div className="no-photo">No photo</div>
        )}
      </div>

      <div className="card-body">
        <div className="pill-row">
          <span className="pill ghost">{item.category}</span>
          <span className="pill">{item.type === "auction" ? "AUCTION" : "BUY NOW"}</span>
        </div>

        <h3>{item.title}</h3>
        {item.type === "auction" ? (
          <div className="muted">Current bid: ${item.currentBid || 0}</div>
        ) : (
          <div className="muted">Price: ${item.price || 0}</div>
        )}

        <div className="row mt8">
          {item.type === "auction" ? (
            <button className="primary" onClick={() => onBid(item)}>Place bid</button>
          ) : (
            <button className="primary" onClick={() => onBuy(item)}>Buy now</button>
          )}
          {canModify && (
            <>
              <button className="ghost" onClick={() => onEdit(item)}>Edit</button>
              <button className="danger" onClick={() => onDelete(item)}>Delete</button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

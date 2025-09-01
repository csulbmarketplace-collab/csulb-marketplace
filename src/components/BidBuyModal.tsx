import React, { useState } from "react";
import { Listing } from "../types";

export default function BidBuyModal({
  listing,
  mode, // "bid" | "buy"
  onClose,
  onSubmitBid,
  onConfirmBuy,
}: {
  listing: Listing;
  mode: "bid" | "buy";
  onClose: () => void;
  onSubmitBid: (amount: number) => void;
  onConfirmBuy: () => void;
}) {
  const [bid, setBid] = useState(
    listing.currentBid ? listing.currentBid + 1 : 1
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === "bid" ? "Place a bid" : "Confirm purchase"}</h3>
          <button className="icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="mini">
            <strong>{listing.title}</strong>
            <span className="muted">{listing.category}</span>
          </div>

          {mode === "bid" ? (
            <>
              <div className="row">
                <label>Current bid</label>
                <div>${listing.currentBid || 0}</div>
              </div>
              <div className="row">
                <label>Your bid</label>
                <input
                  type="number"
                  min={(listing.currentBid || 0) + 1}
                  value={bid}
                  onChange={(e) => setBid(parseFloat(e.target.value))}
                />
              </div>
            </>
          ) : (
            <div className="row">
              <label>Price</label>
              <div>${listing.price || 0}</div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="ghost" onClick={onClose}>Cancel</button>
          {mode === "bid" ? (
            <button className="primary" onClick={() => onSubmitBid(bid)}>
              Submit bid
            </button>
          ) : (
            <button className="primary" onClick={onConfirmBuy}>
              Pay now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

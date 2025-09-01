import React, { useRef, useState } from "react";
import { ListingType } from "../types";

const CATEGORIES = [
  "Textbooks",
  "Clothing",
  "Dorm & Furniture",
  "Electronics",
  "Bikes & Scooters",
  "Tickets",
  "Housing",
  "Other",
];

export default function NewListingModal({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (data: {
    title: string;
    category: string;
    type: ListingType;
    price?: number;
    photos: string[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<ListingType>("buy");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...urls]);
  }

  function submit() {
    if (!title || !category || photos.length === 0) {
      alert("Title, category, and at least 1 photo are required.");
      return;
    }
    onPublish({ title, category, type, price, photos });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>New listing</h3>
          <button className="icon" onClick={onClose}>✕</button>
        </div>

        <div className="grid2 modal-body">
          <div>
            <label>Title</label>
            <input
              placeholder="e.g., CSULB hoodie (M)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label>Type</label>
            <div className="seg">
              <button
                type="button"
                className={type === "auction" ? "seg-on" : ""}
                onClick={() => setType("auction")}
              >
                Auction
              </button>
              <button
                type="button"
                className={type === "buy" ? "seg-on" : ""}
                onClick={() => setType("buy")}
              >
                Buy now
              </button>
            </div>

            {type === "buy" ? (
              <>
                <label>Price (USD)</label>
                <input
                  type="number"
                  min={1}
                  value={price ?? ""}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  placeholder="e.g., 45"
                />
              </>
            ) : (
              <div className="hint">Bidders will set the price.</div>
            )}

            <div className="mt8">
              <button className="ghost" onClick={onClose}>Cancel</button>
              <button className="primary" onClick={submit}>Publish</button>
            </div>
          </div>

          <div>
            <label>Photos</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="thumbs">
              {photos.map((src, i) => (
                <div key={i} className="thumb">
                  <img src={src} alt={`ph${i}`} />
                  <button
                    className="x"
                    onClick={() =>
                      setPhotos((p) => p.filter((_, idx) => idx !== i))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="hint">Add multiple photos. On phones, you can pick from the gallery.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

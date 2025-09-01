import { Listing, User } from "./types";

const ACCOUNTS_KEY = "csulb.accounts.v1";
const LISTINGS_KEY = "csulb.listings.v1";
const SESSION_KEY  = "csulb.session.v1";

export function loadAccounts(): Record<string,string> {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}"); }
  catch { return {}; }
}
export function saveAccounts(map: Record<string,string>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
}

export function loadListings(): Listing[] {
  try { return JSON.parse(localStorage.getItem(LISTINGS_KEY) || "[]"); }
  catch { return []; }
}
export function saveListings(list: Listing[]) {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(list));
}

export function saveSession(user: User|null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}
export function loadSession(): User|null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

import { loadAccounts, saveAccounts, saveSession } from "./storage";
import type { User } from "./types";

export function requiresCsulbStudent(email: string) {
  return email.endsWith("@student.csulb.edu");
}

export function register(email: string, password: string): User {
  if (!requiresCsulbStudent(email)) {
    throw new Error("You must use your @student.csulb.edu email.");
  }
  const accounts = loadAccounts();
  if (accounts[email]) {
    throw new Error("Account already exists.");
  }
  accounts[email] = password;
  saveAccounts(accounts);
  const user = { email, password };
  saveSession(user);
  return user;
}

export function login(email: string, password: string): User {
  if (!requiresCsulbStudent(email)) {
    throw new Error("You must use your @student.csulb.edu email.");
  }
  const accounts = loadAccounts();
  if (!accounts[email] || accounts[email] !== password) {
    throw new Error("Invalid credentials.");
  }
  const user = { email, password };
  saveSession(user);
  return user;
}

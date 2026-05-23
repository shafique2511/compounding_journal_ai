import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { initializeUserAccount } from "@/lib/firebase/firestore";

function requireAuthInstance() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured. Add Firebase values to the environment.");
  }

  return auth;
}

export async function registerWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(requireAuthInstance(), email, password);
  await initializeUserAccount(credential.user);
  return credential;
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuthInstance(), email, password);
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(requireAuthInstance(), new GoogleAuthProvider());
  await initializeUserAccount(credential.user);
  return credential;
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(requireAuthInstance(), email);
}

export function logout() {
  return signOut(requireAuthInstance());
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(requireAuthInstance(), callback);
}

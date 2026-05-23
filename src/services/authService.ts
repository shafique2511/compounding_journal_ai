import {
  getCurrentSession,
  getCurrentUser,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  requireUser,
  sendPasswordReset,
} from "@/lib/supabase";

export const authService = {
  getCurrentSession,
  getCurrentUser,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  requireUser,
  sendPasswordReset,
};

export {
  getCurrentSession,
  getCurrentUser,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  requireUser,
  sendPasswordReset,
};

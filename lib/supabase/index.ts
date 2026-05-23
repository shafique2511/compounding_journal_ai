export { getStorageBucket, getSupabaseClient, requireSupabaseClient } from "@/lib/supabase/config";
export {
  getCurrentSession,
  getCurrentUser,
  requireUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
  type SupabaseAuthUser,
} from "@/src/lib/supabase/client";
export {
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  sendPasswordReset,
  subscribeToAuthState,
  type AuthUser,
} from "@/lib/supabase/auth";
export {
  deleteUserDocument,
  deleteUserDocuments,
  initializeUserAccount,
  listTrades,
  listUserDocuments,
  saveAiAnalysis,
  saveFilterPreset,
  saveStrategy,
  saveTrade,
  saveUserSettings,
} from "@/lib/supabase/database";
export {
  deleteStorageFile,
  uploadBackupFile,
  uploadStrategyScreenshot,
  uploadTradeScreenshot,
} from "@/lib/supabase/storage";

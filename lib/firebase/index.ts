export {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "@/lib/firebase/config";
export {
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  sendPasswordReset,
  subscribeToAuthState,
} from "@/lib/firebase/auth";
export {
  deleteUserDocument,
  initializeUserAccount,
  listTrades,
  listUserDocuments,
  saveAiAnalysis,
  saveFilterPreset,
  saveStrategy,
  saveTrade,
  saveUserSettings,
} from "@/lib/firebase/firestore";
export {
  deleteStorageFile,
  uploadStrategyScreenshot,
  uploadTradeScreenshot,
} from "@/lib/firebase/storage";

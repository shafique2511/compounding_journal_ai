import { deleteUserDocument, listUserDocuments, saveAiAnalysis as saveAnalysis } from "@/lib/supabase";
import type { AiAnalysis } from "@/types";

export function saveAiAnalysis(userId: string, analysis: AiAnalysis) {
  return saveAnalysis(userId, analysis);
}

export function getAiAnalyses(userId: string) {
  return listUserDocuments<AiAnalysis>(userId, "aiAnalyses");
}

export async function getAiAnalysisById(userId: string, analysisId: string) {
  return (await getAiAnalyses(userId)).find((analysis) => analysis.id === analysisId) ?? null;
}

export function deleteAiAnalysis(userId: string, analysisId: string) {
  return deleteUserDocument(userId, "aiAnalyses", analysisId);
}

export const aiAnalysisService = {
  deleteAiAnalysis,
  getAiAnalyses,
  getAiAnalysisById,
  saveAiAnalysis,
};

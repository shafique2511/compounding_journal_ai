import { deleteUserDocument, listUserDocuments, saveFilterPreset } from "@/lib/supabase";
import type { FilterPreset } from "@/types";

export function createPreset(userId: string, preset: FilterPreset) {
  return saveFilterPreset(userId, preset);
}

export function updatePreset(userId: string, preset: FilterPreset) {
  return saveFilterPreset(userId, preset);
}

export function deletePreset(userId: string, presetId: string) {
  return deleteUserDocument(userId, "filterPresets", presetId);
}

export function getAllPresets(userId: string) {
  return listUserDocuments<FilterPreset>(userId, "filterPresets");
}

export async function getPresetById(userId: string, presetId: string) {
  return (await getAllPresets(userId)).find((preset) => preset.id === presetId) ?? null;
}

export const filterPresetService = {
  createPreset,
  deletePreset,
  getAllPresets,
  getPresetById,
  updatePreset,
};

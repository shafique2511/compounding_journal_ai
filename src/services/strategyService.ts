import { deleteUserDocument, listUserDocuments, saveStrategy } from "@/lib/supabase";
import type { Strategy } from "@/types";

export function createStrategy(userId: string, strategy: Strategy) {
  return saveStrategy(userId, strategy);
}

export function updateStrategy(userId: string, strategy: Strategy) {
  return saveStrategy(userId, strategy);
}

export function deleteStrategy(userId: string, strategyId: string) {
  return deleteUserDocument(userId, "strategies", strategyId);
}

export function getAllStrategies(userId: string) {
  return listUserDocuments<Strategy>(userId, "strategies");
}

export async function getActiveStrategies(userId: string) {
  return (await getAllStrategies(userId)).filter((strategy) => strategy.isActive);
}

export async function getStrategyById(userId: string, strategyId: string) {
  return (await getAllStrategies(userId)).find((strategy) => strategy.id === strategyId) ?? null;
}

export const strategyService = {
  createStrategy,
  deleteStrategy,
  getActiveStrategies,
  getAllStrategies,
  getStrategyById,
  updateStrategy,
};

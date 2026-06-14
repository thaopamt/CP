import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ICreateShopItemPayload,
  IEquipResult,
  IUpdateShopItemPayload,
} from '@cp/shared';
import { shopApi } from './shop.api';
import { useAuthStore } from '../stores/auth.store';

export const shopQueryKeys = {
  all: ['shop'] as const,
  catalog: () => ['shop', 'catalog'] as const,
  inventory: () => ['shop', 'inventory'] as const,
  adminItems: () => ['shop', 'admin', 'items'] as const,
};

export function useShopCatalog() {
  return useQuery({
    queryKey: shopQueryKeys.catalog(),
    queryFn: () => shopApi.catalog().then((res) => res.data),
  });
}

function invalidateShop(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: shopQueryKeys.all });
  void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
  void qc.invalidateQueries({ queryKey: ['leaderboard'] });
  void qc.invalidateQueries({ queryKey: ['student-badges'] });
}

/** Reflect the equipped-character avatar change in the persisted auth user. */
function syncAvatar(result: IEquipResult) {
  useAuthStore.getState().updateUser({ avatarUrl: result.avatarUrl });
}

export function usePurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopApi.purchase(itemId).then((res) => res.data),
    onSuccess: () => invalidateShop(qc),
  });
}

export function useEquipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopApi.equip(itemId).then((res) => res.data),
    onSuccess: (result) => {
      syncAvatar(result);
      invalidateShop(qc);
    },
  });
}

export function useUnequipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopApi.unequip(itemId).then((res) => res.data),
    onSuccess: (result) => {
      syncAvatar(result);
      invalidateShop(qc);
    },
  });
}

// ── Admin management ───────────────────────────────────────────────────
export function useManageShopItems() {
  return useQuery({
    queryKey: shopQueryKeys.adminItems(),
    queryFn: () => shopApi.adminList().then((res) => res.data),
  });
}

export function useCreateShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateShopItemPayload) =>
      shopApi.adminCreate(payload).then((res) => res.data),
    onSuccess: () => invalidateShop(qc),
  });
}

export function useUpdateShopItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IUpdateShopItemPayload) =>
      shopApi.adminUpdate(id, payload).then((res) => res.data),
    onSuccess: () => invalidateShop(qc),
  });
}

export function useDeleteShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shopApi.adminRemove(id).then((res) => res.data),
    onSuccess: () => invalidateShop(qc),
  });
}

export function useUploadShopImage() {
  return useMutation({
    mutationFn: (file: File) => shopApi.adminUpload(file),
  });
}

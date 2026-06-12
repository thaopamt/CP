import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shopApi } from './shop.api';

export const shopQueryKeys = {
  all: ['shop'] as const,
  catalog: () => ['shop', 'catalog'] as const,
  inventory: () => ['shop', 'inventory'] as const,
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
    onSuccess: () => invalidateShop(qc),
  });
}

export function useUnequipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopApi.unequip(itemId).then((res) => res.data),
    onSuccess: () => invalidateShop(qc),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateShopItemPayload, IUpdateShopItemPayload } from '@cp/shared';
import { shopAdminApi } from './shop-admin.api';

const KEY = ['shop-admin', 'items'] as const;

export function useAdminShopItems() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => shopAdminApi.list().then((res) => res.data),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: KEY });
  void qc.invalidateQueries({ queryKey: ['shop'] }); // student catalog/inventory
}

export function useCreateShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateShopItemPayload) => shopAdminApi.create(payload).then((r) => r.data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: IUpdateShopItemPayload }) =>
      shopAdminApi.update(id, patch).then((r) => r.data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteShopItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shopAdminApi.remove(id).then((r) => r.data),
    onSuccess: () => invalidate(qc),
  });
}

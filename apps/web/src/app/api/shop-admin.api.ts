import { ICreateShopItemPayload, IShopItem, IUpdateShopItemPayload } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const shopAdminApi = {
  list() {
    return apiClient.get<IShopItem[]>('/shop-admin/items');
  },
  create(payload: ICreateShopItemPayload) {
    return apiClient.post<IShopItem>('/shop-admin/items', payload);
  },
  update(id: string, patch: IUpdateShopItemPayload) {
    return apiClient.patch<IShopItem>(`/shop-admin/items/${id}`, patch);
  },
  remove(id: string) {
    return apiClient.delete<{ ok: true }>(`/shop-admin/items/${id}`);
  },
};

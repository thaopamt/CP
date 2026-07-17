import {
  ICreateShopItemPayload,
  IEquipResult,
  IPurchaseResult,
  IShopCatalogEntry,
  IShopCatalogResponse,
  IShopItem,
  IUpdateShopItemPayload,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const shopApi = {
  catalog() {
    return apiClient.get<IShopCatalogResponse>('/shop/catalog');
  },
  inventory() {
    return apiClient.get<IShopCatalogEntry[]>('/shop/inventory');
  },
  purchase(itemId: string) {
    return apiClient.post<IPurchaseResult>(`/shop/purchase/${itemId}`);
  },
  equip(itemId: string, gender?: 'male' | 'female') {
    const url = gender ? `/shop/equip/${itemId}?gender=${gender}` : `/shop/equip/${itemId}`;
    return apiClient.post<IEquipResult>(url);
  },
  unequip(itemId: string) {
    return apiClient.post<IEquipResult>(`/shop/unequip/${itemId}`);
  },

  // ── Admin management ─────────────────────────────────────────────────
  adminList() {
    return apiClient.get<IShopItem[]>('/shop/admin/items');
  },
  adminCreate(payload: ICreateShopItemPayload) {
    return apiClient.post<IShopItem>('/shop/admin/items', payload);
  },
  adminUpdate(id: string, payload: IUpdateShopItemPayload) {
    return apiClient.patch<IShopItem>(`/shop/admin/items/${id}`, payload);
  },
  adminRemove(id: string) {
    return apiClient.delete<{ success: true }>(`/shop/admin/items/${id}`);
  },
  async adminUpload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<{ url: string }>('/shop/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};

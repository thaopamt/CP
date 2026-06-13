import {
  CharacterGender,
  IEquipResult,
  IPurchaseResult,
  IShopCatalogEntry,
  IShopCatalogResponse,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const shopApi = {
  catalog() {
    return apiClient.get<IShopCatalogResponse>('/shop/catalog');
  },
  inventory() {
    return apiClient.get<IShopCatalogEntry[]>('/shop/inventory');
  },
  setGender(gender: CharacterGender) {
    return apiClient.post<IEquipResult>(`/shop/character/gender/${gender}`);
  },
  purchase(itemId: string) {
    return apiClient.post<IPurchaseResult>(`/shop/purchase/${itemId}`);
  },
  equip(itemId: string) {
    return apiClient.post<IEquipResult>(`/shop/equip/${itemId}`);
  },
  unequip(itemId: string) {
    return apiClient.post<IEquipResult>(`/shop/unequip/${itemId}`);
  },
};

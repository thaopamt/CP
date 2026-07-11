import { ICheckinResult, ICheckinStatus } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const checkinApi = {
  me() {
    return apiClient.get<ICheckinStatus>('/checkin/me');
  },
  checkIn() {
    return apiClient.post<ICheckinResult>('/checkin');
  },
};

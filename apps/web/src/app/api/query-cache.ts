export const queryStaleTime = {
  realtime: 10_000,
  attendance: 15_000,
  dashboard: 20_000,
  userScoped: 30_000,
  adminList: 30_000,
  reference: 60_000,
  publishedDetail: 5 * 60_000,
} as const;

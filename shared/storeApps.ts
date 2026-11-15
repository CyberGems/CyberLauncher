export type StoreAppDiscoveryProgress =
  | { stage: 'listing' }
  | { stage: 'icons'; processed: number; total: number }
  | { stage: 'preparing' };

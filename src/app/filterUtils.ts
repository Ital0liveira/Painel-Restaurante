import { Checkpad, OrderSheet } from './interfaces';
import type { UiStatus } from './filtersSlice';

export function mapActivityToUiStatus(activity: Checkpad['activity']): UiStatus {
  switch (activity) {
    case 'active':
      return 'Ocupada';
    case 'empty':
      return 'Livre';
    case 'inactive':
    default:
      return 'Reservada';
  }
}

export function normalize(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase();
}

export function buildOrdersIndex(ordersheets: OrderSheet[]): Map<number, OrderSheet> {
  const m = new Map<number, OrderSheet>();
  for (const o of ordersheets) m.set(o.id, o);
  return m;
}

export interface AppliedFilters {
  statuses: UiStatus[];
  attendantName: string | null;
  searchQuery: string;
}

export function filterCheckpads(
  checkpads: Checkpad[],
  ordersById: Map<number, OrderSheet>,
  filters: AppliedFilters,
): Checkpad[] {
  const wantStatuses = new Set(filters.statuses);
  const attendant = normalize(filters.attendantName);
  const q = normalize(filters.searchQuery);

  return checkpads.filter((c) => {
    if (wantStatuses.size > 0) {
      const status = mapActivityToUiStatus(c.activity);
      if (!wantStatuses.has(status)) return false;
    }

    if (attendant) {
      const hasAuthor = normalize(c.authorName).includes(attendant);
      if (!hasAuthor) return false;
    }

    if (q) {
      const identifierNormalized = normalize(c.identifier);
      
      if (identifierNormalized === q) {
        return true;
      }

      const inIdentifier = identifierNormalized.includes(q);
      const inAuthor = normalize(c.authorName).includes(q);

      let inCustomerOrMain = false;
      for (const orderId of c.orderSheetIds ?? []) {
        const o = ordersById.get(orderId);
        if (!o) continue;
        const mainIdNormalized = normalize(o.mainIdentifier);
        if (mainIdNormalized === q) {
          return true;
        }
        if (mainIdNormalized.includes(q)) {
          inCustomerOrMain = true;
          break;
        }
        if (normalize(o.author?.name).includes(q)) {
          inCustomerOrMain = true;
          break;
        }
      }

      if (!(inIdentifier || inAuthor || inCustomerOrMain)) return false;
    }

    return true;
  });
}



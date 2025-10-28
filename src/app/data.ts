import { Checkpad, Area, OrderSheet } from './interfaces';

// 1. DADOS DAS ÁREAS (O QUE ESTÁ FALTANDO)
export const mockAreas: Area[] = [
  { id: 1, name: 'Salão Principal', maxIdleTime: 1800, maxIdleTimeEnabled: 1 },
  { id: 2, name: 'Varanda', maxIdleTime: 2400, maxIdleTimeEnabled: 1 },
];

// 2. DADOS DAS COMANDAS
export const mockOrderSheets: OrderSheet[] = [
  {
    id: 101,
    author: { id: 1, name: 'Garçom 1', type: 'waiter' },
    opened: new Date().toISOString(),
    checkpad: { id: 1, hash: 'hash123', identifier: '001' },
    subtotal: 150.50,
    mainIdentifier: 'Mesa 01',
    numberOfCustomers: 2,
  },
  {
    id: 102,
    author: { id: 2, name: 'Garçom 2', type: 'waiter' },
    opened: new Date().toISOString(),
    checkpad: { id: 2, hash: 'hash456', identifier: '002' },
    subtotal: 80.00,
    mainIdentifier: 'Mesa 02',
    numberOfCustomers: 4,
  },
];

// 3. DADOS DOS CHECKPADS (QUE VOCÊ JÁ TEM)
export const mockCheckpads: Checkpad[] = [
  {
    id: 1,
    hash: 'hash123',
    model: 'tablet',
    modelIcon: 'tablet',
    identifier: '001',
    activity: 'active',
    subtotal: 150.50,
    authorName: 'Garçom 1',
    idleTime: 300, 
    lastOrderCreated: new Date().toISOString(),
    orderSheetIds: [101],
    numberOfCustomers: 2,
  },
  {
    id: 2,
    hash: 'hash456',
    model: 'smartphone',
    modelIcon: 'smartphone',
    identifier: '002',
    activity: 'inactive',
    subtotal: 80.00,
    authorName: 'Garçom 2',
    idleTime: 1900,
    lastOrderCreated: new Date(Date.now() - 2000000).toISOString(),
    orderSheetIds: [102],
    numberOfCustomers: 4,
  },
  {
    id: 3,
    hash: 'hash789',
    model: 'tablet',
    modelIcon: 'tablet',
    identifier: '003',
    activity: 'empty',
    subtotal: null,
    authorName: null,
    idleTime: null,
    lastOrderCreated: null,
    orderSheetIds: [],
    numberOfCustomers: null,
  },
];
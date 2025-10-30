'use client';

import React, { useMemo, useState } from 'react';
import { Utensils, Clock, Search, Tent, Building2, FileText } from 'lucide-react';

import { Checkpad } from './interfaces'; 
import { selectAllCheckpads } from './checkpadsSlice';
import { useAppSelector, useAppDispatch } from './hooks';
import { setSearchQuery, toggleStatus, setAttendantName } from './filtersSlice';
import { buildOrdersIndex, filterCheckpads, mapActivityToUiStatus } from './filterUtils';
import { mockOrderSheets, mockAreas } from './data';
import { openCreateModal, setStep2Field } from './createOrderSheetSlice';
import { selectAllOrderSheets } from './orderSheetsSlice';
import CreateOrderSheetModal from './components/CreateOrderSheetModal';
import ToastContainer from './components/ToastContainer';
import ComandaDetailsModal from './components/ComandaDetailsModal';
import { openComandaDetails } from './uiSlice';
import { OrderSheet } from './interfaces';

// Adicionar função auxiliar para calcular tempo de ocupação da mesa
function calculateOccupationTime(
  checkpad: Checkpad,
  ordersIndex: Map<number, OrderSheet>
): number {
  const orders = (checkpad.orderSheetIds ?? [])
    .map(id => ordersIndex.get(id))
    .filter(Boolean) as OrderSheet[];
  
  if (orders.length === 0) return 0;
  
  // Encontrar a comanda mais antiga (primeira abertura)
  const oldestOrder = orders.reduce((oldest, current) => {
    const oldestTime = Date.parse(oldest.opened);
    const currentTime = Date.parse(current.opened);
    return currentTime < oldestTime ? current : oldest;
  });
  
  const openedTime = Date.parse(oldestOrder.opened);
  if (Number.isNaN(openedTime)) return 0;
  
  const diffMs = Date.now() - openedTime;
  return Math.max(0, Math.floor(diffMs / 60000)); // minutos
}

// Calcular idleTime (tempo desde último pedido) dinamicamente
function calculateIdleTime(
  checkpad: Checkpad,
  ordersIndex: Map<number, OrderSheet>
): number {
  // Se lastOrderCreated existe, usar ele
  if (checkpad.lastOrderCreated) {
    const lastOrderTime = Date.parse(checkpad.lastOrderCreated);
    if (!Number.isNaN(lastOrderTime)) {
      const diffMs = Date.now() - lastOrderTime;
      return Math.max(0, Math.floor(diffMs / 60000));
    }
  }
  
  // Caso contrário, calcular baseado na comanda mais recente
  const orders = (checkpad.orderSheetIds ?? [])
    .map(id => ordersIndex.get(id))
    .filter(Boolean) as OrderSheet[];
  
  if (orders.length === 0) return 0;
  
  // Encontrar a comanda mais recente
  const newestOrder = orders.reduce((newest, current) => {
    const newestTime = Date.parse(newest.opened);
    const currentTime = Date.parse(current.opened);
    return currentTime > newestTime ? current : newest;
  });
  
  const openedTime = Date.parse(newestOrder.opened);
  if (Number.isNaN(openedTime)) return 0;
  
  const diffMs = Date.now() - openedTime;
  return Math.max(0, Math.floor(diffMs / 60000)); // minutos
}

function CheckpadCard({ checkpad, ordersIndex }: { checkpad: Checkpad, ordersIndex: Map<number, import('./interfaces').OrderSheet> }) {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);

  // Calcular valores dinamicamente
  const occupationTime = calculateOccupationTime(checkpad, ordersIndex);
  const idleTime = calculateIdleTime(checkpad, ordersIndex);
  
  // Detectar inatividade (15+ min sem pedido novo)
  const isInactive = checkpad.activity === 'active' && idleTime >= 15;

  const handleClick = () => {
    dispatch(openCreateModal());
    dispatch(setStep2Field({ field: 'checkpadId', value: checkpad.id }));
    if ((mockAreas ?? []).length === 1) {
      dispatch(setStep2Field({ field: 'areaId', value: (mockAreas[0] ?? {}).id ?? null }));
    }
  };

  const getStatusColor = (activity: Checkpad['activity']) => {
    switch (activity) {
      case 'active': return 'border-red-500'; // Ocupada - vermelho
      case 'inactive': return 'border-yellow-500'; // Reservada - amarelo
      case 'empty':
      default: return 'border-green-500'; // Livre - verde
    }
  };

  const StatusLabel = mapActivityToUiStatus(checkpad.activity);

  const orders = (checkpad.orderSheetIds ?? []).map(id => ordersIndex.get(id)).filter(Boolean);
  const numOpenOrders = orders.length;
  const ordersTotal = orders.reduce((sum, o) => sum + (o?.subtotal ?? 0), 0);
  const estimatedTotal = ordersTotal > 0 ? ordersTotal : (checkpad.subtotal ?? 0);
  
  // Obter primeira comanda para exibir informações
  const firstOrder = orders.find(Boolean);
  // Priorizar customerName, depois mainIdentifier como fallback
  const customerName = firstOrder?.customerName ?? firstOrder?.mainIdentifier ?? null;
  const comandaIdentifier = firstOrder 
    ? String(firstOrder.id) // ID da comanda como identificador
    : null;
  
  // Buscar atendente: primeiro do checkpad, depois das comandas
  const attendantName = checkpad.authorName ?? firstOrder?.author?.name ?? null;

  const IconForModel = () => {
    switch (checkpad.modelIcon) {
      case 'table-restaurant':
        return <Utensils className="h-4 w-4" />;
      case 'tent':
        return <Tent className="h-4 w-4" />;
      case 'apartment':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
    }
  };

  const highlight = ui.lastActivatedCheckpadId === checkpad.id && ui.highlightUntilTs != null && Date.now() < ui.highlightUntilTs;

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow ${
        isInactive 
          ? 'border-4 border-red-900 ring-2 ring-red-800' // Borda vermelha vinho
          : getStatusColor(checkpad.activity)
      } cursor-pointer ${highlight ? 'ring-2 ring-orange-400' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <IconForModel />
            <span className="text-sm">{checkpad.model}</span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-md ${
              checkpad.activity === 'active'
                ? 'bg-red-50 text-red-700' // Ocupada - vermelho
                : checkpad.activity === 'inactive'
                ? 'bg-yellow-50 text-yellow-700' // Reservada - amarelo
                : 'bg-green-50 text-green-700' // Livre - verde
            }`}
          >
            {StatusLabel}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-semibold text-gray-900">{checkpad.identifier}</div>
          {checkpad.activity !== 'empty' ? (
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {customerName ? (
                <div className="font-medium text-gray-900">{customerName}</div>
              ) : (
                <div className="text-gray-500">-</div>
              )}
              {comandaIdentifier && (
                <div className="text-xs text-gray-500">Comanda: {comandaIdentifier}</div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">Livre</div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-t bg-gray-50 rounded-b-xl flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {occupationTime > 0 ? `${occupationTime} min` : '-'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span>{numOpenOrders}</span>
        </div>
        <div className="font-semibold text-gray-800">
          R$ {estimatedTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}


function formatCurrencyBRL(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function minutesBetween(dateIso: string): number {
  const opened = Date.parse(dateIso);
  if (Number.isNaN(opened)) return 0;
  const diffMs = Date.now() - opened;
  return Math.max(0, Math.floor(diffMs / 60000));
}

function getComandaIdentifier(o: import('./interfaces').OrderSheet): string {
  // Prioridade aproximada: mainIdentifier -> checkpad identifier -> id interno
  return (
    o.mainIdentifier ?? o.checkpad?.identifier ?? String(o.id)
  );
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const allCheckpads = useAppSelector(selectAllCheckpads);
  const filters = useAppSelector(s => s.filters);
  const allOrderSheets = useAppSelector(selectAllOrderSheets);
  // Combinar comandas mock iniciais com comandas do Redux
  const allOrders = useMemo(() => {
    const mockSet = new Set(mockOrderSheets.map(o => o.id));
    const reduxOrders = allOrderSheets.filter(o => !mockSet.has(o.id));
    return [...mockOrderSheets, ...reduxOrders];
  }, [allOrderSheets]);
  const ordersIndex = buildOrdersIndex(allOrders);
  const checkpads = filterCheckpads(allCheckpads, ordersIndex, filters);
  const [activeTab, setActiveTab] = useState<'locais' | 'comandas'>('locais');

  const pageSize = 24;
  const [page, setPage] = useState(1);

  const [comandaFilters, setComandaFilters] = useState({
    attentionOnly: false,
    minMinutes: '',
    maxMinutes: '',
    minValue: '',
    maxValue: '',
  });

  const ui = useAppSelector(s => s.ui);
  const filteredOrders = useMemo(() => {
    const q = (filters.searchQuery ?? '').trim().toLowerCase();
    // aplica overrides superficiais (checkpadId) para refletir transferências
    let list = allOrders.map(o => {
      const override = ui.orderOverrides[o.id];
      if (!override) return o;
      const checkpad = override.checkpadId != null ? { id: override.checkpadId, hash: '', identifier: String(override.checkpadId) } : o.checkpad;
      return { ...o, checkpad };
    });
    if (q) {
      list = list.filter(o => {
        const vals = [
          o.mainIdentifier,
          o.checkpad?.identifier,
          String(o.id),
        ].map(v => (v ?? '').toString().toLowerCase());
        return vals.some(v => v.includes(q));
      });
    }

    // Attention (15+ min sem pedido) — usa tempo desde abertura da comanda
    if (comandaFilters.attentionOnly) {
      list = list.filter(o => {
        const tempoMin = minutesBetween(o.opened);
        return tempoMin >= 15;
      });
    }

    const minMin = comandaFilters.minMinutes ? Number(comandaFilters.minMinutes) : null;
    const maxMin = comandaFilters.maxMinutes ? Number(comandaFilters.maxMinutes) : null;
    const minVal = comandaFilters.minValue ? Number(comandaFilters.minValue) : null;
    const maxVal = comandaFilters.maxValue ? Number(comandaFilters.maxValue) : null;

    if (minMin != null || maxMin != null) {
      list = list.filter(o => {
        const m = minutesBetween(o.opened);
        if (minMin != null && m < minMin) return false;
        if (maxMin != null && m > maxMin) return false;
        return true;
      });
    }

    if (minVal != null || maxVal != null) {
      list = list.filter(o => {
        const v = o.subtotal ?? 0;
        if (minVal != null && v < minVal) return false;
        if (maxVal != null && v > maxVal) return false;
        return true;
      });
    }
    return list;
  }, [filters.searchQuery, comandaFilters, ui.orderOverrides, allOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* left sidebar accent */}
        <div className="w-3 bg-orange-500" />

        <main className="flex-1 p-6">
          {/* top bar */
          }
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Visão Geral</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border bg-white p-1">
                <button
                  onClick={() => setActiveTab('locais')}
                  className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'locais' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
                >
                  Locais
                </button>
                <button
                  onClick={() => setActiveTab('comandas')}
                  className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'comandas' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
                >
                  Comandas
                </button>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="pl-9 pr-3 py-2 rounded-lg border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Cliente, mesa, comanda"
                  value={filters.searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                />
              </div>
              <button
                onClick={() => dispatch(openCreateModal())}
                className="px-3 py-2 text-sm rounded-md bg-orange-600 text-white hover:bg-orange-700"
              >
                Nova Comanda
              </button>
            </div>
          </div>

          {activeTab === 'locais' && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="inline-flex rounded-lg border bg-white p-1">
                {(['Ocupada','Livre','Reservada'] as const).map(status => {
                  const active = filters.statuses.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => dispatch(toggleStatus(status))}
                      className={`px-3 py-1.5 text-sm rounded-md ${active ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
              <input
                className="px-3 py-2 rounded-lg border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Filtrar por atendente"
                value={filters.attendantName ?? ''}
                onChange={(e) => dispatch(setAttendantName(e.target.value || null))}
              />
            </div>
          )}
          {activeTab === 'comandas' && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 bg-white border rounded-md px-3 py-1.5">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={comandaFilters.attentionOnly}
                  onChange={(e) => { setPage(1); setComandaFilters(v => ({ ...v, attentionOnly: e.target.checked })); }}
                />
                Atenção (15+ min)
              </label>

              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600">Tempo (min):</span>
                <input
                  className="w-20 px-2 py-1.5 rounded-md border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="min"
                  value={comandaFilters.minMinutes}
                  onChange={(e) => { setPage(1); setComandaFilters(v => ({ ...v, minMinutes: e.target.value.replace(/[^0-9]/g,'') })); }}
                />
                <span className="text-gray-500">—</span>
                <input
                  className="w-20 px-2 py-1.5 rounded-md border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="max"
                  value={comandaFilters.maxMinutes}
                  onChange={(e) => { setPage(1); setComandaFilters(v => ({ ...v, maxMinutes: e.target.value.replace(/[^0-9]/g,'') })); }}
                />
              </div>

              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600">Valor:</span>
                <input
                  className="w-24 px-2 py-1.5 rounded-md border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="min"
                  value={comandaFilters.minValue}
                  onChange={(e) => { setPage(1); setComandaFilters(v => ({ ...v, minValue: e.target.value.replace(/[^0-9]/g,'') })); }}
                />
                <span className="text-gray-500">—</span>
                <input
                  className="w-24 px-2 py-1.5 rounded-md border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="max"
                  value={comandaFilters.maxValue}
                  onChange={(e) => { setPage(1); setComandaFilters(v => ({ ...v, maxValue: e.target.value.replace(/[^0-9]/g,'') })); }}
                />
              </div>
            </div>
          )}

          {activeTab === 'locais' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {checkpads.map((checkpad: Checkpad) => (
                <CheckpadCard key={checkpad.id} checkpad={checkpad} ordersIndex={ordersIndex} />
              ))}
            </div>
          ) : (
            <>
              {/* Comandas grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pagedOrders.map((o) => {
                  const tempoMin = minutesBetween(o.opened);
                  const valor = o.subtotal;
                  const attention = tempoMin >= 15;
                  const title = getComandaIdentifier(o);
                  const areaNome = o.checkpad ? o.checkpad.identifier : '-';
                  return (
                    <div
                      key={o.id}
                      onClick={() => dispatch(openComandaDetails({ orderId: o.id }))}
                      className={`rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${attention ? 'ring-2 ring-amber-400' : ''}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Utensils className="h-4 w-4" />
                            <span className="text-sm">Comanda</span>
                          </div>
                          {attention && (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">15+ min</span>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="text-lg font-semibold text-gray-900 break-words">{title}</div>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div>Área/Mesa: {areaNome}</div>
                            <div>Clientes: {o.numberOfCustomers}</div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t bg-gray-50 rounded-b-xl flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{tempoMin} min</span>
                        </div>
                        <div className="font-semibold text-gray-800">{formatCurrencyBRL(valor)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* pagination */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 text-sm rounded-md border ${page === 1 ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1.5 text-sm rounded-md border ${page === totalPages ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* modals */}
      <CreateOrderSheetModal />
      <ComandaDetailsModal />
      <ToastContainer />

      {/* bottom status bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center gap-3">
          <span className="font-medium">Solas Restaurante</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">Loja aberta</span>
        </div>
        <span className="text-gray-500">v0.1.0</span>
      </div>
    </div>
  );
}
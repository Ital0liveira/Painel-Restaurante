'use client';

import React, { useMemo, useState } from 'react';
import { X, Clock, Users, MapPin } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { closeComandaDetails, setOrderOverride, addToast } from '../uiSlice';
import { openCreateModal, setStep2Field } from '../createOrderSheetSlice';
import { selectAllCheckpads } from '../checkpadsSlice';
import { selectAllOrderSheets } from '../orderSheetsSlice';
import { mockOrderSheets, mockAreas } from '../data';

function formatCurrencyBRL(value: number): string { return `R$ ${value.toFixed(2)}`; }

function minutesBetween(dateIso: string): number {
  const opened = Date.parse(dateIso);
  if (Number.isNaN(opened)) return 0;
  const diffMs = Date.now() - opened;
  return Math.max(0, Math.floor(diffMs / 60000));
}

export default function ComandaDetailsModal() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);
  const allCheckpads = useAppSelector(selectAllCheckpads);
  const allOrderSheets = useAppSelector(selectAllOrderSheets);

  const order = useMemo(() => {
    const id = ui.comandaDetails.orderId;
    if (id == null) return null;
    
    // Primeiro tentar encontrar no Redux
    const reduxOrder = allOrderSheets.find(o => o.id === id);
    if (reduxOrder) return reduxOrder;
    
    // Se não encontrar no Redux, procurar nos mocks
    return mockOrderSheets.find(o => o.id === id) ?? null;
  }, [ui.comandaDetails.orderId, allOrderSheets]);

  const [transferCheckpadId, setTransferCheckpadId] = useState<number | ''>('');
  const [onlyFree, setOnlyFree] = useState(true);
  const [filterModel, setFilterModel] = useState<string>('');

  if (!ui.comandaDetails.isOpen || !order) return null;

  const currentCheckpadId = ui.orderOverrides[order.id]?.checkpadId ?? order.checkpad?.id ?? null;
  const currentCheckpad = allCheckpads.find(c => c.id === currentCheckpadId);
  const tempoMin = minutesBetween(order.opened);
  
  const availableModels = useMemo(() => {
    const models = new Set(allCheckpads.map(c => c.model));
    return Array.from(models).sort();
  }, [allCheckpads]);

  const candidates = useMemo(() => {
    let list = allCheckpads;
    if (onlyFree) list = list.filter(c => c.activity === 'empty');
    if (filterModel) list = list.filter(c => c.model === filterModel);
    // evita mostrar o mesmo local atual
    if (currentCheckpadId != null) list = list.filter(c => c.id !== currentCheckpadId);
    // ordena: livres primeiro já filtrado; em seguida por identifier asc
    return [...list].sort((a,b) => a.identifier.localeCompare(b.identifier, 'pt-BR'));
  }, [allCheckpads, onlyFree, filterModel, currentCheckpadId]);

  const onClose = () => dispatch(closeComandaDetails());

  const onNovoPedido = () => {
    dispatch(openCreateModal());
    if (currentCheckpadId != null) {
      dispatch(setStep2Field({ field: 'checkpadId', value: currentCheckpadId }));
    }
    dispatch(addToast({ message: 'Iniciado novo pedido', type: 'success' }));
  };

  const onTransferir = () => {
    if (transferCheckpadId === '') {
      dispatch(addToast({ message: 'Selecione uma mesa/local', type: 'error' }));
      return;
    }
    if (currentCheckpadId === transferCheckpadId) {
      dispatch(addToast({ message: 'Selecione um local diferente', type: 'error' }));
      return;
    }
    dispatch(setOrderOverride({ orderId: order.id, checkpadId: transferCheckpadId as number }));
    dispatch(addToast({ message: 'Comanda transferida', type: 'success' }));
    setTransferCheckpadId('');
    // Mantemos o modal aberto para visualização; poderia fechar se preferir
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-white shadow-xl border-l p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Detalhes da comanda</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-medium text-gray-900">Identificador:</span>
              <span>{order.mainIdentifier ?? order.checkpad?.identifier ?? `#${order.id}`}</span>
            </div>
            
            {currentCheckpad && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">Local atual:</span>
                <span>{currentCheckpad.identifier} ({currentCheckpad.model})</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">Tempo de ocupação:</span>
              <span>{tempoMin} min</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">Clientes:</span>
              <span>{order.numberOfCustomers}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-900">Valor total estimado:</span>
              <span className="ml-2 text-lg font-semibold text-gray-900">{formatCurrencyBRL(order.subtotal)}</span>
            </div>
            
            {order.author && (
              <div className="text-xs text-gray-500">
                Atendente: {order.author.name}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button onClick={onNovoPedido} className="px-3 py-2 text-sm rounded-md bg-orange-600 text-white hover:bg-orange-700">Novo pedido</button>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">Transferir mesa/área</h3>
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
                Mostrar apenas livres
              </label>
              
              {availableModels.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Modelo:</label>
                  <select
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">Selecionar novo local</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={transferCheckpadId}
                onChange={(e) => setTransferCheckpadId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Selecione</option>
                {candidates.length === 0 ? (
                  <option disabled>Nenhum local disponível</option>
                ) : (
                  candidates.map(c => (
                    <option key={c.id} value={c.id} disabled={c.activity !== 'empty'}>
                      {c.identifier} ({c.model}) {c.activity === 'empty' ? '(Livre)' : '(Ocupado)'}
                    </option>
                  ))
                )}
              </select>
              {candidates.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">Tente ajustar os filtros acima</p>
              )}
            </div>
            
            <div className="flex items-center justify-end">
              <button 
                onClick={onTransferir} 
                disabled={!transferCheckpadId || transferCheckpadId === ''}
                className="px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirmar transferência
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



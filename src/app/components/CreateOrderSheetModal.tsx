'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch } from '../hooks';
import {
  closeCreateModal,
  goToStep2,
  setStep1Error,
  setStep1Field,
  clearStep1Errors,
  backToStep1,
  setStep2Field,
  resetCreateWizard,
} from '../createOrderSheetSlice';
import { useAppSelector } from '../hooks';
import { mockAreas, mockAttendants } from '../data';
import {
  selectAllCheckpads,
  addOrderSheetToCheckpad,
} from '../checkpadsSlice';
import { addOrderSheet, selectAllOrderSheets } from '../orderSheetsSlice';
import { addToast, setHighlight } from '../uiSlice';

function normalizePhone(input: string): string {
  return input.replace(/\D+/g, '');
}

function formatPhoneDisplay(input: string): string {
  const digits = normalizePhone(input);
  // Desired: DDD + número, sem +55. Ex.: 11 91234-5678 ou (11) 91234-5678
  if (digits.length <= 2) return `${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

export default function CreateOrderSheetModal() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(s => s.createOrderSheet);
  const allCheckpads = useAppSelector(selectAllCheckpads);
  const allOrderSheets = useAppSelector(selectAllOrderSheets);

  const existingVisibleIds = useMemo(() => {
    const orderMain = new Set(
      allOrderSheets.map(o => o.mainIdentifier).filter(Boolean) as string[]
    );
    const checkpadIds = new Set(
      allCheckpads.map(c => c.identifier).filter(Boolean) as string[]
    );
    return new Set<string>([...orderMain, ...checkpadIds]);
  }, [allOrderSheets, allCheckpads]);

  // Informações sobre comandas existentes na mesa selecionada
  const selectedCheckpadInfo = useMemo(() => {
    if (!state.step2.checkpadId) return null;
    const checkpad = allCheckpads.find(c => c.id === state.step2.checkpadId);
    if (!checkpad) return null;

    const existingOrderSheets = (checkpad.orderSheetIds ?? [])
      .map(id => allOrderSheets.find(o => o.id === id))
      .filter(Boolean) as typeof allOrderSheets;

    return {
      checkpad,
      existingOrderSheets,
      count: existingOrderSheets.length,
    };
  }, [state.step2.checkpadId, allCheckpads, allOrderSheets]);

  if (!state.isOpen) return null;

  const onClose = () => dispatch(closeCreateModal());

  const onChange = (field: 'visibleIdentifier' | 'customerName' | 'customerPhone', value: string) => {
    const v = field === 'customerPhone' ? formatPhoneDisplay(value) : value;
    dispatch(setStep1Field({ field, value: v }));
  };

  const validate = (): boolean => {
    let ok = true;
    dispatch(clearStep1Errors());

    const id = state.step1.visibleIdentifier.trim();
    if (id.length === 0) {
      dispatch(setStep1Error({ field: 'visibleIdentifier', message: 'Informe um identificador.' }));
      ok = false;
    } else if (existingVisibleIds.has(id)) {
      dispatch(setStep1Error({ field: 'visibleIdentifier', message: 'Identificador já em uso.' }));
      ok = false;
    }

    const phoneDigits = normalizePhone(state.step1.customerPhone);
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      dispatch(setStep1Error({ field: 'customerPhone', message: 'Telefone incompleto.' }));
      ok = false;
    }

    return ok;
  };

  const onNext = () => {
    if (validate()) {
      dispatch(goToStep2());
    }
  };

  const onBack = () => dispatch(backToStep1());

  const onConfirm = () => {
    // Validar área quando houver múltiplas
    if ((mockAreas ?? []).length > 1 && (state.step2.areaId == null)) {
      dispatch(addToast({ message: 'Selecione uma área', type: 'error' }));
      return;
    }

    const selectedId = state.step2.checkpadId;
    if (selectedId == null) {
      dispatch(addToast({ message: 'Selecione uma mesa/local antes de confirmar', type: 'error' }));
      return;
    }

    const checkpad = allCheckpads.find(c => c.id === selectedId);
    if (!checkpad) {
      dispatch(addToast({ message: 'Mesa/local não encontrado', type: 'error' }));
      return;
    }

    // Gerar ID único para a nova comanda (incrementar do maior ID existente)
    const maxId = allOrderSheets.length > 0
      ? Math.max(...allOrderSheets.map(o => o.id))
      : 0;
    const newOrderSheetId = maxId + 1;

    // Determinar mainIdentifier (prioridade: visibleIdentifier > customerName > telefone formatado)
    const mainIdentifier = state.step1.visibleIdentifier.trim() ||
      state.step1.customerName.trim() ||
      state.step1.customerPhone.trim() ||
      String(newOrderSheetId);

    // Buscar atendente selecionado ou usar padrão
    const selectedAttendantId = state.step1.attendantId;
    const selectedAttendant = selectedAttendantId 
      ? mockAttendants.find(a => a.id === selectedAttendantId)
      : null;

    // Se nenhum atendente foi selecionado, usar o padrão
    const author = selectedAttendant ?? {
      id: 127,
      name: 'Guilherme 2',
      type: 'seller',
    };

    // Criar a nova comanda
    dispatch(
      addOrderSheet({
        id: newOrderSheetId,
        mainIdentifier,
        customerName: state.step1.customerName.trim() || undefined,
        customerPhone: state.step1.customerPhone.trim() || undefined,
        checkpadId: checkpad.id,
        checkpadHash: checkpad.hash,
        checkpadIdentifier: checkpad.identifier,
        numberOfCustomers: 1, // Padrão, pode ser ajustado no futuro
        author,
      })
    );

    // Adicionar comanda ao checkpad (e ativar se estiver vazia)
    dispatch(
      addOrderSheetToCheckpad({
        checkpadId: checkpad.id,
        orderSheetId: newOrderSheetId,
      })
    );

    // Se mesa estava vazia, ativar (já é feito pelo addOrderSheetToCheckpad, mas mantemos para highlight)
    if (checkpad.activity === 'empty') {
      dispatch(setHighlight({ checkpadId: selectedId, durationMs: 5000 }));
    }

    dispatch(addToast({ message: 'Comanda criada com sucesso', type: 'success' }));
    dispatch(resetCreateWizard());
    dispatch(closeCreateModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div className="w-full max-w-md h-full bg-white shadow-xl border-l p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nova comanda</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {state.step === 1 ? (
          <>
            <p className="text-sm text-gray-500 mt-1">Dados iniciais da comanda</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Identificador da comanda</label>
                <input
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                    state.errors.visibleIdentifier ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Cartão #21, Etiqueta, etc."
                  value={state.step1.visibleIdentifier}
                  onChange={(e) => onChange('visibleIdentifier', e.target.value)}
                />
                {state.errors.visibleIdentifier && (
                  <p className="mt-1 text-xs text-red-600">{state.errors.visibleIdentifier}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do cliente</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Maria Silva"
                  value={state.step1.customerName}
                  onChange={(e) => onChange('customerName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                    state.errors.customerPhone ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="(11) 91234-5678"
                  value={state.step1.customerPhone}
                  onChange={(e) => onChange('customerPhone', e.target.value)}
                  inputMode="tel"
                />
                {state.errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{state.errors.customerPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Atendente</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                  value={state.step1.attendantId ?? ''}
                  onChange={(e) =>
                    dispatch(setStep1Field({ 
                      field: 'attendantId', 
                      value: e.target.value ? Number(e.target.value) : null 
                    }))
                  }
                >
                  <option value="">Selecione um atendente</option>
                  {mockAttendants.map(attendant => (
                    <option key={attendant.id} value={attendant.id}>
                      {attendant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={onNext}
                className="px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black"
              >
                Avançar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-1">Associação e observações</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Área</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={state.step2.areaId ?? ''}
                  onChange={(e) =>
                    dispatch(setStep2Field({ field: 'areaId', value: e.target.value ? Number(e.target.value) : null }))
                  }
                >
                  <option value="">Selecione uma área</option>
                  {(mockAreas ?? []).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mesa/Local</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={state.step2.checkpadId ?? ''}
                  onChange={(e) =>
                    dispatch(setStep2Field({ field: 'checkpadId', value: e.target.value ? Number(e.target.value) : null }))
                  }
                >
                  <option value="">Selecione</option>
                  {allCheckpads.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.identifier} {c.activity === 'empty' ? '(Livre)' : c.activity === 'active' ? '(Ocupada)' : ''}
                    </option>
                  ))}
                </select>
                {selectedCheckpadInfo && selectedCheckpadInfo.count > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900">
                      Esta mesa possui {selectedCheckpadInfo.count} comanda(s) ativa(s)
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Uma nova comanda será adicionada à mesa.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observações (opcional)</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Ex.: Aniversário, atendimento prioritário"
                  value={state.step2.notes}
                  onChange={(e) => dispatch(setStep2Field({ field: 'notes', value: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={onBack}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



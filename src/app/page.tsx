'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { Checkpad } from './interfaces'; 
import { selectAllCheckpads } from './checkpadsSlice'; // 1. IMPORTAÇÃO CORRETA

// --- Componente Card (para organizar) ---
function CheckpadCard({ checkpad }: { checkpad: Checkpad }) {
  
  // Define a cor com base na atividade
  const getStatusColor = (activity: Checkpad['activity']) => {
    switch (activity) {
      case 'active':
        return 'border-green-500'; // Ativo
      case 'inactive':
        return 'border-red-500'; // Inativo/Ocioso
      case 'empty':
      default:
        return 'border-gray-400'; // Vazio
    }
  };

  return (
    <div 
      className={`p-4 border-l-8 rounded-lg shadow-md bg-white ${getStatusColor(checkpad.activity)}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-gray-800">
          Checkpad: {checkpad.identifier}
        </h3>
        <span className={`font-semibold ${
          checkpad.activity === 'active' ? 'text-green-600' : 
          checkpad.activity === 'inactive' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {checkpad.activity}
        </span>
      </div>
      
      {checkpad.activity !== 'empty' ? (
        <>
          <p className="text-gray-600">Autor: {checkpad.authorName}</p>
          <p className="text-gray-600">Clientes: {checkpad.numberOfCustomers}</p>
          <p className="text-lg font-semibold text-gray-800 mt-2">
            Subtotal: R$ {checkpad.subtotal?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ociosidade: {checkpad.idleTime ? `${Math.floor(checkpad.idleTime / 60)} min` : 'N/A'}
          </p>
        </>
      ) : (
        <p className="text-gray-500">Este checkpad está livre.</p>
      )}
    </div>
  );
}


export default function HomePage() {

  // 2. LINHA CORRIGIDA
  const checkpads = useSelector(selectAllCheckpads);
 
  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Painel de Checkpads
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {checkpads.map((checkpad: Checkpad) => (
          <CheckpadCard key={checkpad.id} checkpad={checkpad} />
        ))}
      </div>
    </main>
  );
}
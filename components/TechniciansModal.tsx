
import React, { useState, useEffect } from 'react';
import { Technician } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface TechniciansModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onSave: (technicians: Technician[]) => void;
  onDeleteCallback: (technicianId: string) => void;
}

const TechniciansModal: React.FC<TechniciansModalProps> = ({ isOpen, onClose, technicians, onSave, onDeleteCallback }) => {
  const [items, setItems] = useState<Technician[]>([]);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setItems(JSON.parse(JSON.stringify(technicians)));
    }
  }, [isOpen, technicians]);

  if (!isOpen) return null;

  const handleNameChange = (id: string, newName: string) => {
    setItems(items.map(item => item.id === id ? { ...item, name: newName } : item));
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() === '') return;
    const newItem: Technician = {
      id: `t${new Date().getTime()}`,
      name: newItemName.trim()
    };
    const updatedItems = [...items, newItem];
    onSave(updatedItems);
    setNewItemName('');
  };

  const handleDelete = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    onSave(updatedItems);
    onDeleteCallback(id);
  };

  const handleSaveChanges = () => {
    onSave(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Gerenciar Técnicos</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                  className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100">
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddNew} className="mt-6 pt-6 border-t">
            <label htmlFor="new-technician" className="block text-sm font-medium text-slate-700 mb-1">Adicionar Novo Técnico</label>
            <div className="flex items-center gap-2">
              <input
                id="new-technician"
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nome do técnico"
                className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Adicionar
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
            Fechar
          </button>
          <button type="button" onClick={handleSaveChanges} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Salvar Nomes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechniciansModal;

import React, { useState, useEffect } from 'react';
import { RoutePlanRow, Technician, Vehicle } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RoutePlanRow[];
  onSavePlan: (plan: RoutePlanRow[]) => void;
  technicians: Technician[];
  onSaveTechnicians: (technicians: Technician[]) => void;
  vehicles: Vehicle[];
  onSaveVehicles: (vehicles: Vehicle[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSavePlan,
  technicians,
  onSaveTechnicians,
  vehicles,
  onSaveVehicles
}) => {
  const [activeTab, setActiveTab] = useState('clients');
  
  // States for each tab
  const [localPlan, setLocalPlan] = useState<RoutePlanRow[]>([]);
  const [localTechnicians, setLocalTechnicians] = useState<Technician[]>([]);
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>([]);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newTechName, setNewTechName] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalPlan(JSON.parse(JSON.stringify(plan)));
      setLocalTechnicians(JSON.parse(JSON.stringify(technicians)));
      setLocalVehicles(JSON.parse(JSON.stringify(vehicles)));
    }
  }, [isOpen, plan, technicians, vehicles]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onSavePlan(localPlan);
    onSaveTechnicians(localTechnicians);
    onSaveVehicles(localVehicles);
    onClose();
  };
  
  const handleDeleteRow = (rowId: string) => {
    setLocalPlan(prev => prev.filter(r => r.id !== rowId));
  }
  
  const handleDeleteTechnician = (techId: string) => {
     setLocalTechnicians(prev => prev.filter(t => t.id !== techId));
  }
  
  const handleDeleteVehicle = (vehicleId: string) => {
     setLocalVehicles(prev => prev.filter(v => v.id !== vehicleId));
  }


  const renderClientsTab = () => (
    <>
      <div className="space-y-3">
        {localPlan.map(row => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              type="text"
              value={row.name}
              onChange={(e) => setLocalPlan(localPlan.map(r => r.id === row.id ? { ...r, name: e.target.value } : r))}
              className={`flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 ${row.type === 'group' ? 'font-bold' : ''}`}
            />
            <button onClick={() => handleDeleteRow(row.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => {
          e.preventDefault();
          if (newGroupName.trim() === '') return;
          const newGroup = { type: 'group' as const, id: `g${new Date().getTime()}`, name: newGroupName.trim().toUpperCase() };
          setLocalPlan([...localPlan, newGroup]);
          setNewGroupName('');
      }} className="mt-6 pt-6 border-t">
          <label htmlFor="new-group" className="block text-sm font-medium text-slate-700 mb-1">Adicionar Nova Região (Grupo)</label>
          <div className="flex items-center gap-2">
          <input id="new-group" type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Nome da região" className="flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Adicionar</button>
          </div>
      </form>
    </>
  );

  const renderTechniciansTab = () => (
    <>
      <div className="space-y-3">
        {localTechnicians.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => setLocalTechnicians(localTechnicians.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
              className="flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button onClick={() => handleDeleteTechnician(item.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => {
          e.preventDefault();
          if (newTechName.trim() === '') return;
          const newItem = { id: `t${new Date().getTime()}`, name: newTechName.trim() };
          setLocalTechnicians([...localTechnicians, newItem]);
          setNewTechName('');
      }} className="mt-6 pt-6 border-t">
          <label htmlFor="new-technician" className="block text-sm font-medium text-slate-700 mb-1">Adicionar Novo Técnico</label>
          <div className="flex items-center gap-2">
          <input id="new-technician" type="text" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} placeholder="Nome do técnico" className="flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Adicionar</button>
          </div>
      </form>
    </>
  );
  
  const renderVehiclesTab = () => (
    <>
      <div className="space-y-3">
        {localVehicles.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => setLocalVehicles(localVehicles.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
              className="flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button onClick={() => handleDeleteVehicle(item.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-100">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
       <form onSubmit={(e) => {
          e.preventDefault();
          if (newVehicleName.trim() === '') return;
          const newItem = { id: `v${new Date().getTime()}`, name: newVehicleName.trim() };
          setLocalVehicles([...localVehicles, newItem]);
          setNewVehicleName('');
      }} className="mt-6 pt-6 border-t">
          <label htmlFor="new-vehicle" className="block text-sm font-medium text-slate-700 mb-1">Adicionar Novo Veículo</label>
          <div className="flex items-center gap-2">
          <input id="new-vehicle" type="text" value={newVehicleName} onChange={(e) => setNewVehicleName(e.target.value)} placeholder="Nome do veículo" className="flex-grow block w-full rounded-md border-slate-300 shadow-sm sm:text-sm bg-white text-slate-900 focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Adicionar</button>
          </div>
      </form>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
          <div className="mt-4 border-b border-slate-200">
            <nav className="-mb-px flex space-x-6">
              <button onClick={() => setActiveTab('clients')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'clients' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Rotas e Regiões</button>
              <button onClick={() => setActiveTab('technicians')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'technicians' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Técnicos</button>
              <button onClick={() => setActiveTab('vehicles')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vehicles' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Veículos</button>
            </nav>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'clients' && renderClientsTab()}
          {activeTab === 'technicians' && renderTechniciansTab()}
          {activeTab === 'vehicles' && renderVehiclesTab()}
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSaveAll} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Salvar Alterações e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
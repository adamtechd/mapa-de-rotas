import React, { useState, useEffect } from 'react';
import { RouteData, Technician, Vehicle, WeeklyData } from '../types';

declare const moment: any;

interface RouteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routeData: RouteData) => void;
  onClearRoute: (routeId: string) => void;
  routeData: RouteData | null;
  technicians: Technician[];
  vehicles: Vehicle[];
  currentDate: any;
}

const RouteEditModal: React.FC<RouteEditModalProps> = ({ isOpen, onClose, onSave, onClearRoute, routeData, technicians, vehicles, currentDate }) => {
  const [formData, setFormData] = useState<RouteData | null>(null);

  useEffect(() => {
    if (isOpen && routeData) {
      // Create a deep copy to avoid mutating state directly
      setFormData(JSON.parse(JSON.stringify(routeData)));
    } else {
        setFormData(null);
    }
  }, [isOpen, routeData]);
  
  const weekKey = currentDate.format('YYYY-WW');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    
    if (['tools', 'vehicleId', 'meta', 'notes'].includes(name)) {
        const updatedWeeklyData = { ...(formData.weeklyData || {}) };
        if (!updatedWeeklyData[weekKey]) {
            updatedWeeklyData[weekKey] = { tools: '', vehicleId: '', meta: '', notes: '' };
        }
        (updatedWeeklyData[weekKey] as any)[name] = value;
        setFormData({ ...formData, weeklyData: updatedWeeklyData });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleAssignmentChange = (dateKey: string, selectedTechnicianIds: string[]) => {
      if (!formData) return;
      const newAssignments = {
          ...formData.assignments,
          [dateKey]: { technicianIds: selectedTechnicianIds }
      };
      // Remove assignment if no technicians are selected
      if(selectedTechnicianIds.length === 0) {
        delete newAssignments[dateKey];
      }
      setFormData({ ...formData, assignments: newAssignments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
        onSave(formData);
    }
  };

  if (!isOpen || !formData) return null;

  const daysOfWeek = Array.from({length: 5}, (_, i) => {
      const day = currentDate.clone().startOf('isoWeek').add(i, 'days');
      return {
          dateKey: day.format('YYYY-MM-DD'),
          label: day.format('dddd')
      }
  });

  const weeklyValues = formData.weeklyData?.[weekKey] || { tools: '', vehicleId: '', meta: '', notes: '' };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 capitalize">Editar Rota: {formData.name}</h2>
            <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome da Rota / Cliente</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-slate-900" />
            </div>
          </div>
          <div className="p-6 border-t border-b border-slate-200 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {daysOfWeek.map(day => (
                  <div key={day.dateKey}>
                      <label htmlFor={day.dateKey} className="block text-sm font-medium text-slate-700 capitalize">{day.label}</label>
                      <select 
                        id={day.dateKey} 
                        name={day.dateKey}
                        multiple
                        value={formData.assignments[day.dateKey]?.technicianIds || []}
                        onChange={(e) => handleAssignmentChange(day.dateKey, Array.from(e.target.selectedOptions, option => option.value))}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-48 bg-white text-slate-900"
                      >
                          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label htmlFor="vehicleId" className="block text-sm font-medium text-slate-700">Veículo</label>
                <select id="vehicleId" name="vehicleId" value={weeklyValues.vehicleId} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-slate-900">
                  <option value="">Nenhum</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                 <label htmlFor="meta" className="block text-sm font-medium text-slate-700">Meta PCE</label>
                 <input type="text" id="meta" name="meta" value={weeklyValues.meta} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-slate-900" />
              </div>
              <div className="md:col-span-2">
                 <label htmlFor="tools" className="block text-sm font-medium text-slate-700">Ferramentas / Insumos</label>
                 <textarea id="tools" name="tools" value={weeklyValues.tools} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-slate-900"></textarea>
              </div>
              <div className="md:col-span-2">
                 <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Observações</label>
                 <textarea id="notes" name="notes" value={weeklyValues.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-slate-900"></textarea>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
             <div>
                <button type="button" onClick={() => onClearRoute(formData.id)} className="text-sm font-medium text-orange-600 hover:text-orange-800">
                  Limpar Dados da Rota (nesta semana)
                </button>
             </div>
             <div className="flex gap-3">
                 <button type="button" onClick={onClose} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                    Cancelar
                 </button>
                 <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    Salvar
                 </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteEditModal;

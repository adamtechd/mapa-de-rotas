import React from 'react';
import { RoutePlanRow, RouteData, Technician, Vehicle, User } from '../types';
import { EMPTY_WEEKLY_DATA } from '../constants';
import { TrashIcon } from './icons/TrashIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

declare const moment: any;

interface RouteMapViewProps {
  plan: RoutePlanRow[];
  technicians: Technician[];
  vehicles: Vehicle[];
  currentDate: any;
  onEditRoute: (route: RouteData) => void;
  onDeleteRow: (id: string) => void;
  onAddNewRouteInGroup: (groupId: string) => void;
  onClearDayAssignment: (routeId: string, dateKey: string) => void;
  userRole: User['role'];
}

const RouteMapView: React.FC<RouteMapViewProps> = ({ plan, technicians, vehicles, currentDate, onEditRoute, onDeleteRow, onAddNewRouteInGroup, onClearDayAssignment, userRole }) => {

  const getTechnicianNames = (ids: string[]): string[] => {
    if (!ids) return [];
    return ids.map(id => technicians.find(t => t.id === id)?.name || 'N/A');
  };

  const getVehicleName = (id: string): string => vehicles.find(v => v.id === id)?.name || '';
  
  const baseHeaders = ["CLIENTES/ROTA", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "PADRÃO / FERRAMENTAS / INSUMOS", "CARRO", "META PCE", "OBSERVAÇÃO"];
  const headers = userRole === 'admin' ? [...baseHeaders, "AÇÕES"] : baseHeaders;


  const weekDates = Array.from({ length: 5 }, (_, i) => currentDate.clone().startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD'));
  const weekKey = currentDate.format('YYYY-WW');

  if(plan.length === 0) {
    return (
      <div className="text-center p-10 text-slate-500">
        <p>Nenhuma rota para exibir.</p>
        <p className="text-sm">Tente desmarcar "Ocultar linhas vazias" ou adicione novas rotas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead className="bg-slate-100">
          <tr>
            {headers.map(header => (
              <th key={header} className="text-left text-xs font-bold text-slate-600 uppercase tracking-wider p-3 border border-slate-300">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {plan.map(row => {
            if (row.type === 'group') {
              return (
                <tr key={row.id} className="bg-blue-100 text-blue-900 font-bold">
                  <td colSpan={userRole === 'admin' ? headers.length - 1 : headers.length} className="p-2 text-center border-x border-slate-300">
                    <div className="flex justify-center items-center gap-2">
                        <span>{row.name}</span>
                        {userRole === 'admin' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddNewRouteInGroup(row.id); }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-full transition-colors"
                                aria-label="Adicionar rota neste grupo"
                            >
                               <PlusCircleIcon />
                            </button>
                        )}
                    </div>
                  </td>
                  {userRole === 'admin' && (
                    <td className="p-2 border border-slate-300 align-middle text-center">
                       <button
                          onClick={() => onDeleteRow(row.id)}
                          className="text-blue-800 hover:text-red-600 p-1 rounded-full transition-colors"
                          aria-label="Excluir"
                        >
                          <TrashIcon />
                        </button>
                    </td>
                  )}
                </tr>
              );
            }

            const route: RouteData = row;
            const weeklyData = route.weeklyData?.[weekKey] || EMPTY_WEEKLY_DATA;

            return (
              <tr 
                key={route.id} 
                onClick={userRole === 'admin' ? () => onEditRoute(route) : undefined} 
                className={`group ${userRole === 'admin' ? 'hover:bg-indigo-50 cursor-pointer' : ''}`}
              >
                <td className="p-2 border border-slate-300 font-semibold text-slate-700 whitespace-nowrap w-[200px]">{route.name}</td>
                
                {weekDates.map(dateKey => {
                  const assignment = route.assignments[dateKey];
                  const hasAssignment = assignment && assignment.technicianIds.length > 0;
                  return (
                    <td key={dateKey} className="p-2 border border-slate-300 text-sm align-top w-[120px] relative">
                      <div className="flex flex-col">
                        {hasAssignment && getTechnicianNames(assignment.technicianIds).map((name, index) => (
                          <span key={index} className="block text-slate-900 font-medium">{name}</span>
                        ))}
                      </div>
                      {hasAssignment && userRole === 'admin' && (
                         <button
                            onClick={(e) => { e.stopPropagation(); onClearDayAssignment(route.id, dateKey); }}
                            className="absolute top-1 right-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Limpar dia"
                         >
                            <XCircleIcon />
                         </button>
                      )}
                    </td>
                  )
                })}

                <td className="p-2 border border-slate-300 text-sm align-top w-[250px] whitespace-pre-wrap text-slate-800 font-medium">{weeklyData.tools}</td>
                <td className="p-2 border border-slate-300 text-sm align-top w-[100px] text-slate-800 font-medium">{getVehicleName(weeklyData.vehicleId || '')}</td>
                <td className="p-2 border border-slate-300 text-sm align-top w-[80px] text-slate-800 font-medium">{weeklyData.meta}</td>
                <td className="p-2 border border-slate-300 text-sm align-top w-[150px] whitespace-pre-wrap text-slate-800 font-medium">{weeklyData.notes}</td>
                
                {userRole === 'admin' && (
                    <td className="p-2 border border-slate-300 text-center align-middle w-[80px]">
                       <button
                            onClick={(e) => { e.stopPropagation(); onDeleteRow(route.id); }}
                            className="text-slate-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors"
                            aria-label="Excluir"
                          >
                            <TrashIcon />
                        </button>
                    </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RouteMapView;
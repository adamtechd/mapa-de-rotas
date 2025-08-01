






import React, { useState, useEffect, useRef } from 'react';
import { PlansData, RoutePlanRow, RouteData, Technician, Vehicle } from './types';
import { TECHNICIANS, VEHICLES, INITIAL_PLANS } from './constants';
import { loadPlans, savePlans, loadTechnicians, saveTechnicians, loadVehicles, saveVehicles } from './services/storageService';
import {
  exportToPdf,
  exportToXlsx,
  exportMonthlyAsImage,
  exportMonthlyToPdfFromImage,
  exportMonthlyToXlsx,
  exportAnnualToPdf,
  exportAnnualToXlsx
} from './services/exportService';
import RouteMapView from './components/WeeklyView';
import MonthlyCalendarView from './components/MonthlyCalendarView';
import AnnualView from './components/AnnualView';
import RouteEditModal from './components/AppointmentModal';
import SettingsModal from './components/SettingsModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { PdfIcon } from './components/icons/PdfIcon';
import { ExcelIcon } from './components/icons/ExcelIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';

declare const moment: any;

// Set the locale globally for the entire application
moment.locale('pt-br');

const MAP_NAMES: { [key: string]: string } = {
  'MG': 'Minas Gerais',
  'ES': 'Espirito Santo',
};

type ViewMode = 'weekly' | 'monthly' | 'yearly';
type SaveStatus = 'idle' | 'saving' | 'saved';

interface MonthlyViewSettings {
  expandDays: boolean;
  hideEmptyWeeks: boolean;
}

const App: React.FC = () => {
  const [plans, setPlans] = useState<PlansData>({});
  const [activeMapKey, setActiveMapKey] = useState<string>('MG');

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(moment());
  const [hideEmptyRows, setHideEmptyRows] = useState(false);

  const [monthlyViewSettings, setMonthlyViewSettings] = useState<MonthlyViewSettings>({
    expandDays: false,
    hideEmptyWeeks: false
  });
  
  const monthlyCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedPlans = loadPlans();
    setPlans(Object.keys(loadedPlans).length > 0 ? loadedPlans : INITIAL_PLANS);

    const loadedTechs = loadTechnicians();
    setTechnicians(loadedTechs.length > 0 ? loadedTechs : TECHNICIANS);

    const loadedVehicles = loadVehicles();
    setVehicles(loadedVehicles.length > 0 ? loadedVehicles : VEHICLES);
  }, []);

  const activePlan = plans[activeMapKey] || [];
  const activeMapName = MAP_NAMES[activeMapKey] || 'Mapa';

  const handleSaveActivePlan = (updatedPlan: RoutePlanRow[]) => {
    const updatedPlans = { ...plans, [activeMapKey]: updatedPlan };
    setPlans(updatedPlans);
    savePlans(updatedPlans);
  };

  const handleSaveAllPlans = (updatedPlans: PlansData) => {
    setPlans(updatedPlans);
    savePlans(updatedPlans);
  }

  const handleSaveTechnicians = (updatedTechnicians: Technician[]) => {
    const originalTechnicians = technicians;

    const deletedTechIds = originalTechnicians
      .filter(oldTech => !updatedTechnicians.some(newTech => newTech.id === oldTech.id))
      .map(t => t.id);

    if (deletedTechIds.length > 0) {
      let allPlansToUpdate = { ...plans };
      deletedTechIds.forEach(techId => {
        Object.keys(allPlansToUpdate).forEach(mapKey => {
          allPlansToUpdate[mapKey] = allPlansToUpdate[mapKey].map(row => {
            if (row.type === 'route') {
              const newAssignments = { ...row.assignments };
              Object.keys(newAssignments).forEach(dateKey => {
                const assignment = newAssignments[dateKey];
                if (assignment && Array.isArray(assignment.technicianIds)) {
                  newAssignments[dateKey] = {
                    ...assignment,
                    technicianIds: assignment.technicianIds.filter(id => id !== techId)
                  };
                }
              });
              return { ...row, assignments: newAssignments };
            }
            return row;
          });
        });
      });
      handleSaveAllPlans(allPlansToUpdate);
    }

    setTechnicians(updatedTechnicians);
    saveTechnicians(updatedTechnicians);
  }

  const handleSaveVehicles = (updatedVehicles: Vehicle[]) => {
    const originalVehicles = vehicles;

    const deletedVehicleIds = originalVehicles
      .filter(oldVehicle => !updatedVehicles.some(newVehicle => newVehicle.id === oldVehicle.id))
      .map(v => v.id);

    if (deletedVehicleIds.length > 0) {
      let allPlansToUpdate = { ...plans };
      deletedVehicleIds.forEach(vehicleId => {
        Object.keys(allPlansToUpdate).forEach(mapKey => {
          allPlansToUpdate[mapKey] = allPlansToUpdate[mapKey].map(row => {
            if (row.type === 'route' && row.weeklyData) {
              const newWeeklyData = { ...row.weeklyData };
              let changed = false;
              Object.keys(newWeeklyData).forEach(weekKey => {
                if (newWeeklyData[weekKey].vehicleId === vehicleId) {
                  newWeeklyData[weekKey].vehicleId = '';
                  changed = true;
                }
              });
              if (changed) {
                return { ...row, weeklyData: newWeeklyData };
              }
            }
            return row;
          });
        });
      });
      handleSaveAllPlans(allPlansToUpdate);
    }

    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);
  }
  
  const handleSaveAllData = () => {
    if (saveStatus !== 'idle') return;
    setSaveStatus('saving');
    try {
      savePlans(plans);
      saveTechnicians(technicians);
      saveVehicles(vehicles);
      
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 300);

    } catch(e) {
      console.error("Failed to save data", e);
      setSaveStatus('idle'); // Or an error state
    }
  };

  const handleEditRoute = (route: RouteData) => {
    setEditingRoute(route);
    setIsRouteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRouteModalOpen(false);
    setEditingRoute(null);
  };

  const handleSaveRoute = (routeData: RouteData) => {
    const updatedPlan = activePlan.map(row => row.id === routeData.id ? routeData : row);
    handleSaveActivePlan(updatedPlan);
    handleCloseModal();
  };

  const handleClearRouteInModal = (routeId: string) => {
    handleClearRouteData(routeId);
    handleCloseModal();
  };

  const handleAddNewRouteInGroup = (groupId: string) => {
    const newRoute: RouteData = {
      type: 'route',
      id: `r${new Date().getTime()}`,
      name: 'NOVA ROTA',
      assignments: {},
      weeklyData: {}
    };

    let updatedPlan = [...activePlan];

    if (groupId && groupId !== '__none__') {
      const groupIndex = activePlan.findIndex(row => row.id === groupId);
      if (groupIndex !== -1) {
        let insertAtIndex = groupIndex + 1;
        while (insertAtIndex < activePlan.length && activePlan[insertAtIndex].type === 'route') {
          insertAtIndex++;
        }
        updatedPlan.splice(insertAtIndex, 0, newRoute);
      } else {
        updatedPlan.push(newRoute);
      }
    } else {
      updatedPlan.push(newRoute);
    }

    handleSaveActivePlan(updatedPlan);
  };

  const handleAddGroup = () => {
    const newGroup = {
      type: 'group' as const,
      id: `g${new Date().getTime()}`,
      name: 'NOVO GRUPO'
    };
    const updatedPlan = [...activePlan, newGroup];
    handleSaveActivePlan(updatedPlan);
  };

  const handleDeleteRow = (rowId: string) => {
    const updatedPlan = activePlan.filter(row => row.id !== rowId);
    handleSaveActivePlan(updatedPlan);
  }

  const handleClearRouteData = (routeId: string) => {
    const weekKey = currentDate.format('YYYY-WW');
    const updatedPlan = activePlan.map(row => {
      if (row.id === routeId && row.type === 'route') {
        // Clear daily assignments for the week
        const newAssignments = { ...row.assignments };
        for (let i = 0; i < 5; i++) {
          const dateKey = currentDate.clone().startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD');
          delete newAssignments[dateKey];
        }

        // Clear weekly data for the week
        const newWeeklyData = { ...row.weeklyData };
        delete newWeeklyData[weekKey];

        return {
          ...row,
          assignments: newAssignments,
          weeklyData: newWeeklyData,
        };
      }
      return row;
    });
    handleSaveActivePlan(updatedPlan);
  };

  const handleClearDayAssignment = (routeId: string, dateKey: string) => {
    const updatedPlan = activePlan.map(row => {
      if (row.id === routeId && row.type === 'route') {
        const newAssignments = { ...row.assignments };
        if (newAssignments[dateKey]) {
          delete newAssignments[dateKey];
        }
        return { ...row, assignments: newAssignments };
      }
      return row;
    });
    handleSaveActivePlan(updatedPlan);
  }

  const handlePrevPeriod = () => {
    switch (viewMode) {
      case 'weekly':
        setCurrentDate(currentDate.clone().subtract(1, 'week'));
        break;
      case 'monthly':
        setCurrentDate(currentDate.clone().subtract(1, 'month'));
        break;
      case 'yearly':
        setCurrentDate(currentDate.clone().subtract(1, 'year'));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (viewMode) {
      case 'weekly':
        setCurrentDate(currentDate.clone().add(1, 'week'));
        break;
      case 'monthly':
        setCurrentDate(currentDate.clone().add(1, 'month'));
        break;
      case 'yearly':
        setCurrentDate(currentDate.clone().add(1, 'year'));
        break;
    }
  };

  const renderPeriodText = () => {
    switch (viewMode) {
      case 'weekly':
        const startOfWeek = currentDate.clone().startOf('isoWeek');
        const endOfWeek = startOfWeek.clone().add(4, 'days');
        return `Período: ${startOfWeek.format('DD/MM')} a ${endOfWeek.format('DD/MM')}`;
      case 'monthly':
        return currentDate.format('MMMM [de] YYYY');
      case 'yearly':
        return currentDate.format('YYYY');
    }
  };

  const getFilteredPlan = () => {
    if (viewMode !== 'weekly' || !hideEmptyRows) {
      return activePlan;
    }

    const hasAssignmentsThisWeek = (route: RouteData) => {
      for (let i = 0; i < 5; i++) {
        const dateKey = currentDate.clone().startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD');
        if (route.assignments[dateKey] && route.assignments[dateKey].technicianIds.length > 0) {
          return true;
        }
      }
      return false;
    }

    const visibleRouteIds = new Set(activePlan.filter(row => row.type === 'route' && hasAssignmentsThisWeek(row as RouteData)).map(r => r.id));

    if (visibleRouteIds.size === 0 && activePlan.some(r => r.type === 'route')) return [];

    const visibleGroupIds = new Set<string>();
    let currentGroupId: string | null = null;

    activePlan.forEach(row => {
      if (row.type === 'group') {
        currentGroupId = row.id;
      } else if (row.type === 'route' && currentGroupId && visibleRouteIds.has(row.id)) {
        visibleGroupIds.add(currentGroupId);
      }
    });

    return activePlan.filter(row => {
      if (row.type === 'group') {
        return visibleGroupIds.has(row.id);
      }
      if (row.type === 'route') {
        return visibleRouteIds.has(row.id);
      }
      return false;
    });
  }

  const displayedPlan = getFilteredPlan();

  const renderActionButtons = () => {
    if (viewMode === 'weekly') {
      return (
        <>
          <button onClick={handleAddGroup} className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors shadow">
            <PlusIcon /> <span className="hidden sm:inline">Grupo</span>
          </button>
          <button onClick={() => handleAddNewRouteInGroup('__none__')} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors shadow">
            <PlusIcon /> <span className="hidden sm:inline">Rota</span>
          </button>
          <button onClick={() => exportToPdf(displayedPlan, technicians, vehicles, currentDate, activeMapName)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar para PDF">
            <PdfIcon />
          </button>
          <button onClick={() => exportToXlsx(displayedPlan, technicians, vehicles, currentDate, activeMapName)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar para Excel">
            <ExcelIcon />
          </button>
        </>
      );
    }

    if (viewMode === 'monthly') {
      return (
        <>
          <button onClick={() => exportMonthlyAsImage(monthlyCalendarRef.current, activeMapName, currentDate)} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Baixar como Imagem">
            <DownloadIcon />
            <span className="hidden sm:inline text-sm font-semibold text-slate-700">PNG</span>
          </button>
          <button onClick={() => exportMonthlyToPdfFromImage(monthlyCalendarRef.current, activeMapName, currentDate)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar PDF Mensal">
            <PdfIcon />
          </button>
          <button onClick={() => exportMonthlyToXlsx(activePlan, technicians, vehicles, currentDate, activeMapName)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar Excel Mensal">
            <ExcelIcon />
          </button>
        </>
      );
    }

    if (viewMode === 'yearly') {
      return (
        <>
          <button onClick={() => exportAnnualToPdf(activePlan, technicians, currentDate, activeMapName)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar PDF Anual">
            <PdfIcon />
          </button>
          <button onClick={() => exportAnnualToXlsx(activePlan, technicians, vehicles, currentDate, activeMapName)} className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200" aria-label="Exportar Excel Anual">
            <ExcelIcon />
          </button>
        </>
      )
    }

    return null;
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <div className="max-w-full mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-900">{activeMapName}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {renderActionButtons()}
              <button 
                  onClick={handleSaveAllData}
                  disabled={saveStatus !== 'idle'}
                  className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-700 transition-all shadow disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  <SaveIcon />
                  <span className="hidden sm:inline min-w-[5rem] text-center">
                    {saveStatus === 'idle' && 'Salvar Tudo'}
                    {saveStatus === 'saving' && 'Salvando...'}
                    {saveStatus === 'saved' && 'Salvo!'}
                  </span>
                </button>
              <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 bg-white text-slate-700 font-semibold py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors shadow border border-slate-200">
                <SettingsIcon /> <span className="hidden sm:inline">Configurações</span>
              </button>
            </div>
          </div>

          <div className="mt-4 border-b border-slate-300">
            <nav className="-mb-px flex space-x-6">
              {Object.keys(MAP_NAMES).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveMapKey(key)}
                  className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeMapKey === key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {MAP_NAMES[key]}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border border-slate-200">
              <button onClick={handlePrevPeriod} className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-md">{"<"}</button>
              <span className="px-4 text-center font-semibold text-slate-800 w-48 capitalize">{renderPeriodText()}</span>
              <button onClick={handleNextPeriod} className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-md">{">"}</button>
            </div>

            <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border border-slate-200">
              {(['weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {mode === 'weekly' ? 'Semanal' : mode === 'monthly' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main>
          {viewMode === 'weekly' && (
            <div className="flex items-center justify-end mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={hideEmptyRows} onChange={(e) => setHideEmptyRows(e.target.checked)} className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500" />
                Ocultar linhas vazias
              </label>
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monthlyViewSettings.expandDays}
                  onChange={(e) => setMonthlyViewSettings(prev => ({ ...prev, expandDays: e.target.checked }))}
                  className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500"
                />
                Expandir todos os dias
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monthlyViewSettings.hideEmptyWeeks}
                  onChange={(e) => setMonthlyViewSettings(prev => ({ ...prev, hideEmptyWeeks: e.target.checked }))}
                  className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500"
                />
                Ocultar semanas vazias
              </label>
            </div>
          )}

          {viewMode === 'weekly' && <RouteMapView plan={displayedPlan} technicians={technicians} vehicles={vehicles} currentDate={currentDate} onEditRoute={handleEditRoute} onDeleteRow={handleDeleteRow} onAddNewRouteInGroup={handleAddNewRouteInGroup} onClearDayAssignment={handleClearDayAssignment} />}
          {viewMode === 'monthly' && <MonthlyCalendarView ref={monthlyCalendarRef} plan={activePlan} technicians={technicians} currentDate={currentDate} settings={monthlyViewSettings} mapName={activeMapName} />}
          {viewMode === 'yearly' && <AnnualView plan={activePlan} currentDate={currentDate} technicians={technicians} />}
        </main>
      </div>

      <RouteEditModal
        isOpen={isRouteModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoute}
        onClearRoute={handleClearRouteInModal}
        routeData={editingRoute}
        technicians={technicians}
        vehicles={vehicles}
        currentDate={currentDate}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        plan={activePlan}
        onSavePlan={handleSaveActivePlan}
        technicians={technicians}
        onSaveTechnicians={handleSaveTechnicians}
        vehicles={vehicles}
        onSaveVehicles={handleSaveVehicles}
      />
    </div>
  );
};

export default App;
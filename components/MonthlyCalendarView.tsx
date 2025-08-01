


import React from 'react';
import { RoutePlanRow, Technician } from '../types';

declare const moment: any;

interface MonthlyViewSettings {
  expandDays: boolean;
  hideEmptyWeeks: boolean;
}

interface MonthlyCalendarViewProps {
  plan: RoutePlanRow[];
  technicians: Technician[];
  currentDate: any;
  settings: MonthlyViewSettings;
  mapName: string;
}

const MonthlyCalendarView = React.forwardRef<HTMLDivElement, MonthlyCalendarViewProps>(
  ({ plan, technicians, currentDate, settings, mapName }, ref) => {
    const firstDayOfMonth = currentDate.clone().startOf('month');
    const firstDayOfCalendar = firstDayOfMonth.clone().startOf('week');

    const getTechnicianName = (id: string): string => technicians.find(t => t.id === id)?.name || id;

    const getAssignmentsForDate = (date: any) => {
      const dateKey = date.format('YYYY-MM-DD');
      const assignments: { routeName: string; techNames: string[] }[] = [];

      plan.forEach(row => {
        if (row.type === 'route') {
          const dailyAssignment = row.assignments[dateKey];
          if (dailyAssignment && dailyAssignment.technicianIds.length > 0) {
            assignments.push({
              routeName: row.name,
              techNames: dailyAssignment.technicianIds.map(getTechnicianName),
            });
          }
        }
      });
      return assignments;
    };

    const calendarDays: any[] = [];
    let day = firstDayOfCalendar.clone();

    for (let i = 0; i < 42; i++) {
      calendarDays.push(day.clone());
      day.add(1, 'day');
    }
    
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }
    
    let visibleWeeks = weeks;
    if(settings.hideEmptyWeeks) {
        visibleWeeks = weeks.filter(week => {
            return week.some(day => getAssignmentsForDate(day).length > 0 && day.isSame(currentDate, 'month'));
        });
    }

    const weekdays = moment.weekdaysMin(true);

    return (
      <div className="bg-white rounded-lg shadow-lg p-4" ref={ref}>
        <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">{mapName}</h2>
            <p className="text-lg font-semibold text-slate-700 capitalize">{currentDate.format('MMMM [de] YYYY')}</p>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {weekdays.map((weekday: string) => (
            <div key={weekday} className="text-center font-semibold text-sm text-slate-600 pb-2 capitalize">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-t border-l border-slate-200">
          {visibleWeeks.flat().map((date, index) => {
            const assignments = getAssignmentsForDate(date);
            const isCurrentMonth = date.isSame(currentDate, 'month');

            return (
              <div
                key={index}
                className={`relative p-2 bg-white border-b border-r border-slate-200 ${isCurrentMonth ? '' : 'bg-slate-50 text-slate-400'} ${settings.expandDays ? 'min-h-[140px]' : 'h-36'}`}
              >
                <div className={`text-sm font-semibold ${isCurrentMonth ? 'text-slate-800' : ''}`}>
                  {date.date()}
                </div>
                <div className={`mt-1 space-y-1 ${settings.expandDays ? '' : 'overflow-y-auto max-h-[100px]'}`}>
                  {assignments.map((ass, idx) => (
                    <div key={idx} className="text-xs p-1 bg-indigo-50 rounded">
                      <p className="font-bold text-indigo-700 truncate">{ass.routeName}</p>
                      <p className="text-slate-600 break-words">{ass.techNames.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default MonthlyCalendarView;
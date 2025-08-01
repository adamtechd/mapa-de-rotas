import React, { useState } from 'react';
import { RoutePlanRow, Technician } from '../types';

declare const moment: any;

interface AssignmentPopupProps {
  date: any;
  assignments: { routeName: string; techNames: string[] }[];
  position: { top: number; left: number };
  placement: 'top' | 'bottom';
  onClose: () => void;
}

const AssignmentPopup: React.FC<AssignmentPopupProps> = ({ date, assignments, position, placement, onClose }) => {
  if (!date) return null;

  const transformStyle = placement === 'bottom'
    ? 'translate(-50%, 15px)'
    : 'translate(-50%, -100%) translateY(-15px)';

  const arrowStyle = placement === 'bottom'
    ? "absolute left-1/2 -top-2 w-4 h-4 bg-white border-l border-t border-slate-200" // Arrow pointing up
    : "absolute left-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-slate-200"; // Arrow pointing down

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl p-4 w-64 border border-slate-200"
        style={{ top: position.top, left: position.left, transform: transformStyle }}
      >
        <div className={arrowStyle} style={{ transform: 'translateX(-50%) rotate(45deg)' }}></div>
        <div className="flex justify-between items-center mb-2 pb-2 border-b">
          <h4 className="font-bold text-slate-800 capitalize">{date.format('DD [de] MMMM')}</h4>
          <button onClick={onClose} className="text-xl font-bold text-slate-500 hover:text-slate-800 leading-none">&times;</button>
        </div>
        {assignments.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {assignments.map((ass, idx) => (
              <div key={idx} className="text-sm p-1.5 bg-indigo-50 rounded">
                <p className="font-bold text-indigo-700">{ass.routeName}</p>
                <p className="text-slate-600">{ass.techNames.join(', ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum agendamento para este dia.</p>
        )}
      </div>
    </>
  );
};


interface MiniCalendarProps {
  month: number;
  year: number;
  assignmentsByDay: { [key: string]: boolean };
  onDayClick: (date: any, event: React.MouseEvent<HTMLDivElement>) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ month, year, assignmentsByDay, onDayClick }) => {
  const monthDate = moment({ year, month });
  const firstDayOfMonth = monthDate.clone().startOf('month');
  const firstDayOfCalendar = firstDayOfMonth.clone().startOf('week');

  const calendarDays: any[] = [];
  let day = firstDayOfCalendar.clone();

  for (let i = 0; i < 42; i++) {
    calendarDays.push(day.clone());
    day.add(1, 'day');
  }

  const weekdays = moment.weekdaysMin(true);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold text-center text-slate-800 mb-3 capitalize">{monthDate.format('MMMM')}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {weekdays.map((wd: string, i: number) => <div key={i}>{wd.slice(0, 3)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.isSame(monthDate, 'month');
          const hasAssignment = assignmentsByDay[date.format('YYYY-MM-DD')] || false;
          return (
            <div 
                key={index} 
                onClick={(e) => isCurrentMonth && hasAssignment && onDayClick(date, e)}
                className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
                            ${isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                            ${hasAssignment && isCurrentMonth ? 'bg-indigo-200 font-bold text-indigo-800 cursor-pointer hover:bg-indigo-300' : ''}
                        `}>
              {date.date()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AnnualViewProps {
  plan: RoutePlanRow[];
  currentDate: any;
  technicians: Technician[];
}

const AnnualView: React.FC<AnnualViewProps> = ({ plan, currentDate, technicians }) => {
  const year = currentDate.year();
  const [popupInfo, setPopupInfo] = useState<{
    date: any;
    assignments: { routeName: string; techNames: string[] }[];
    position: { top: number; left: number };
    placement: 'top' | 'bottom';
  } | null>(null);

  const assignmentsByDay: { [key: string]: boolean } = {};

  plan.forEach(row => {
    if (row.type === 'route') {
      Object.keys(row.assignments).forEach(dateKey => {
        const assignment = row.assignments[dateKey];
        if (assignment && assignment.technicianIds.length > 0) {
          assignmentsByDay[dateKey] = true;
        }
      });
    }
  });

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

  const handleDayClick = (date: any, event: React.MouseEvent<HTMLDivElement>) => {
    const assignments = getAssignmentsForDate(date);
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Heuristic to decide placement.
    // Popup is roughly 250px tall. Place below if there's space, otherwise place above.
    const popupHeightEstimate = 250; // pixels
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = (spaceBelow < popupHeightEstimate && rect.top > spaceBelow) ? 'top' : 'bottom';

    setPopupInfo({
        date,
        assignments,
        position: {
            top: placement === 'bottom' ? rect.bottom + window.scrollY : rect.top + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX,
        },
        placement,
    });
  };

  const handleClosePopup = () => {
      setPopupInfo(null);
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <MiniCalendar 
            key={index} 
            month={index} 
            year={year} 
            assignmentsByDay={assignmentsByDay}
            onDayClick={handleDayClick}
          />
        ))}
      </div>
      {popupInfo && (
        <AssignmentPopup
          date={popupInfo.date}
          assignments={popupInfo.assignments}
          position={popupInfo.position}
          placement={popupInfo.placement}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default AnnualView;
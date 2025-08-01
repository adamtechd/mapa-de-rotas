import { RoutePlanRow, RouteData, Technician, Vehicle } from '../types';
import { EMPTY_WEEKLY_DATA } from '../constants';

declare const moment: any;
declare const jspdf: any;
declare const XLSX: any;
declare const html2canvas: any;

const getTechnicianNames = (ids: string[], technicians: Technician[]): string => {
  if (!ids || ids.length === 0) return '';
  return ids.map(id => technicians.find(t => t.id === id)?.name || id).join('\n');
}

const getTechnicianNameList = (ids: string[], technicians: Technician[]): string => {
  if (!ids || ids.length === 0) return '';
  return ids.map(id => technicians.find(t => t.id === id)?.name || id).join(', ');
}

const getVehicleName = (id: string, vehicles: Vehicle[]): string => vehicles.find(v => v.id === id)?.name || '';

const getDailyAssignment = (route: RouteData, dateKey: string, technicians: Technician[]): string => {
  const assignment = route.assignments[dateKey];
  return assignment ? getTechnicianNames(assignment.technicianIds, technicians) : '';
};

export const exportToPdf = (plan: RoutePlanRow[], technicians: Technician[], vehicles: Vehicle[], currentWeek: any, mapName: string): void => {
  const doc = new jspdf.jsPDF({ orientation: 'landscape' });

  doc.text(`Mapa de Rotas - ${mapName}`, 14, 16);
  doc.setFontSize(10);

  const startOfWeek = currentWeek.clone().startOf('isoWeek');
  const endOfWeek = startOfWeek.clone().add(4, 'days');
  const title = `Período: ${startOfWeek.format('DD/MM/YYYY')} a ${endOfWeek.format('DD/MM/YYYY')}`;

  doc.text(title, 14, 22);

  const tableColumn = ["ROTA", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "PADRÃO / FERRAMENTAS", "CARRO", "META", "OBSERVAÇÃO"];
  const tableRows: any[][] = [];

  const weekDates = Array.from({ length: 5 }, (_, i) => currentWeek.clone().startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD'));
  const weekKey = currentWeek.format('YYYY-WW');

  plan.forEach(row => {
    if (row.type === 'group') {
      tableRows.push([{ content: row.name, colSpan: tableColumn.length, styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [20, 20, 20] } }]);
    } else {
      const routeRow: RouteData = row;
      const weeklyData = routeRow.weeklyData?.[weekKey] || EMPTY_WEEKLY_DATA;
      const rowData = [
        routeRow.name,
        ...weekDates.map(dateKey => getDailyAssignment(routeRow, dateKey, technicians)),
        weeklyData.tools || '',
        getVehicleName(weeklyData.vehicleId || '', vehicles),
        weeklyData.meta || '',
        weeklyData.notes || ''
      ];
      tableRows.push(rowData);
    }
  });

  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      6: { cellWidth: 'auto', halign: 'left' },
      7: { cellWidth: 20 },
      8: { cellWidth: 15 },
      9: { cellWidth: 25, halign: 'left' },
    }
  });

  doc.save(`mapa_de_rotas_${mapName.toLowerCase().replace(' ', '_')}_${currentWeek.format('YYYY-WW')}.pdf`);
};

export const exportToXlsx = (plan: RoutePlanRow[], technicians: Technician[], vehicles: Vehicle[], currentWeek: any, mapName: string): void => {
  const header = ["ROTA / GRUPO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "PADRÃO / FERRAMENTAS / INSUMOS", "CARRO", "META PCE", "OBSERVAÇÃO"];
  const weekDates = Array.from({ length: 5 }, (_, i) => currentWeek.clone().startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD'));
  const weekKey = currentWeek.format('YYYY-WW');

  const worksheetData = plan.map(row => {
    if (row.type === 'group') {
      return { "ROTA / GRUPO": row.name };
    }
    const routeRow: RouteData = row;
    const weeklyData = routeRow.weeklyData?.[weekKey] || EMPTY_WEEKLY_DATA;
    return {
      "ROTA / GRUPO": routeRow.name,
      "SEGUNDA": getDailyAssignment(routeRow, weekDates[0], technicians),
      "TERÇA": getDailyAssignment(routeRow, weekDates[1], technicians),
      "QUARTA": getDailyAssignment(routeRow, weekDates[2], technicians),
      "QUINTA": getDailyAssignment(routeRow, weekDates[3], technicians),
      "SEXTA": getDailyAssignment(routeRow, weekDates[4], technicians),
      "PADRÃO / FERRAMENTAS / INSUMOS": weeklyData.tools || '',
      "CARRO": getVehicleName(weeklyData.vehicleId || '', vehicles),
      "META PCE": weeklyData.meta || '',
      "OBSERVAÇÃO": weeklyData.notes || '',
    };
  });

  const title = `Mapa de Rotas - ${mapName}`;
  const startOfWeek = currentWeek.clone().startOf('isoWeek');
  const endOfWeek = startOfWeek.clone().add(4, 'days');
  const period = `Período: ${startOfWeek.format('DD/MM/YYYY')} a ${endOfWeek.format('DD/MM/YYYY')}`;

  const worksheet = XLSX.utils.json_to_sheet([], { header: header });
  XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: "A1" });
  XLSX.utils.sheet_add_aoa(worksheet, [[period]], { origin: "A2" });
  XLSX.utils.sheet_add_json(worksheet, worksheetData, { origin: "A4", skipHeader: false });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapa de Rotas');
  worksheet['!cols'] = header.map(h => ({ wch: h.length > 20 ? 30 : 20 }));
  XLSX.writeFile(workbook, `mapa_de_rotas_${mapName.toLowerCase().replace(' ', '_')}_${currentWeek.format('YYYY-WW')}.xlsx`);
};

export const exportMonthlyAsImage = (element: HTMLElement | null, mapName: string, currentDate: any): void => {
  if (!element) {
    alert('Elemento do calendário não encontrado para exportação.');
    return;
  }

  html2canvas(element, {
    useCORS: true,
    scale: 2, // Generate a higher-resolution image
    backgroundColor: '#ffffff' // Ensure background is white
  }).then((canvas: any) => {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const fileName = `relatorio_mensal_${mapName.toLowerCase().replace(/ /g, '_')}_${currentDate.format('YYYY_MM')}.png`;
    link.download = fileName;
    link.href = image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }).catch((err: any) => {
    console.error('Error generating calendar image:', err);
    alert('Ocorreu um erro ao tentar gerar a imagem.');
  });
};

export const exportMonthlyToPdfFromImage = (element: HTMLElement | null, mapName: string, currentDate: any): void => {
  if (!element) {
    alert('Elemento do calendário não encontrado para exportação.');
    return;
  }

  html2canvas(element, {
    useCORS: true,
    scale: 2, 
    backgroundColor: '#ffffff'
  }).then((canvas: any) => {
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const orientation = imgWidth > imgHeight ? 'l' : 'p';

    const pdf = new jspdf.jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [imgWidth, imgHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const fileName = `relatorio_mensal_${mapName.toLowerCase().replace(/ /g, '_')}_${currentDate.format('YYYY_MM')}.pdf`;
    pdf.save(fileName);
  }).catch((err: any) => {
    console.error('Error generating calendar PDF:', err);
    alert('Ocorreu um erro ao tentar gerar o PDF.');
  });
};


export const exportMonthlyToXlsx = (plan: RoutePlanRow[], technicians: Technician[], vehicles: Vehicle[], currentDate: any, mapName: string): void => {
  const monthStart = currentDate.clone().startOf('month');
  const monthEnd = currentDate.clone().endOf('month');
  const worksheetData: any[] = [];
  
  plan.forEach(row => {
    if(row.type === 'route') {
      Object.keys(row.assignments).forEach(dateKey => {
        const assignmentDate = moment(dateKey);
        if(assignmentDate.isBetween(monthStart, monthEnd, null, '[]')) {
           const weekKey = assignmentDate.format('YYYY-WW');
           const weeklyData = row.weeklyData?.[weekKey] || EMPTY_WEEKLY_DATA;
           worksheetData.push({
             'Data': assignmentDate.format('DD/MM/YYYY'),
             'Rota': row.name,
             'Técnicos': getTechnicianNameList(row.assignments[dateKey].technicianIds, technicians),
             'Veículo': getVehicleName(weeklyData.vehicleId || '', vehicles),
             'Ferramentas': weeklyData.tools || '',
             'Observações': weeklyData.notes || '',
           });
        }
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData.sort((a,b) => moment(a.Data, 'DD/MM/YYYY').diff(moment(b.Data, 'DD/MM/YYYY'))));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Relatório ${currentDate.format('MM-YYYY')}`);
  worksheet['!cols'] = [{wch: 10}, {wch: 30}, {wch: 40}, {wch: 20}, {wch: 40}, {wch: 40}];
  XLSX.writeFile(workbook, `relatorio_mensal_${mapName.toLowerCase().replace(' ', '_')}_${currentDate.format('YYYY-MM')}.xlsx`);
}

export const exportAnnualToPdf = (plan: RoutePlanRow[], technicians: Technician[], currentDate: any, mapName: string): void => {
  const doc = new jspdf.jsPDF({ orientation: 'p' });
  const year = currentDate.year();
  const weekDayNames = moment.weekdaysMin(true);
  
  doc.setFontSize(22);
  doc.text(`Relatório Anual - ${mapName} ${year}`, 105, 15, { align: 'center' });

  for (let month = 0; month < 12; month++) {
    if (month > 0) doc.addPage();
    const monthDate = moment({ year, month });
    
    doc.setFontSize(14);
    doc.text(monthDate.format('MMMM'), 105, 30, { align: 'center' });
    
    const head = [weekDayNames];
    const body: string[][] = [];
    const firstDayOfMonth = monthDate.clone().startOf('month');
    const firstDayOfCalendar = firstDayOfMonth.clone().startOf('week');

    let currentDay = firstDayOfCalendar.clone();
    
    for(let w = 0; w < 6; w++){
       let weekRow: string[] = [];
       for (let d = 0; d < 7; d++) {
            let dayText = '';
            if(currentDay.isSame(monthDate, 'month')) {
                dayText = String(currentDay.date());
            }
            weekRow.push(dayText);
            currentDay.add(1, 'day');
       }
       body.push(weekRow);
       if(currentDay.isAfter(monthDate.clone().endOf('month'))) break;
    }

    (doc as any).autoTable({
        head,
        body,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], halign: 'center' },
        styles: { fontSize: 10, halign: 'center' },
        didDrawCell: (data: any) => {
            const date = firstDayOfCalendar.clone().add(data.row.index * 7 + data.column.index, 'days');
            const dateKey = date.format('YYYY-MM-DD');
            let hasAssignment = false;
            plan.forEach(p_row => {
                if (p_row.type === 'route' && p_row.assignments[dateKey]) hasAssignment = true;
            });

            if (hasAssignment && date.isSame(monthDate, 'month')) {
                doc.setFillColor(219, 234, 254); // bg-blue-200
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                // Re-draw text to be on top of the fill
                doc.setTextColor(0, 0, 0);
                doc.text(String(data.cell.text), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                    baseline: 'middle',
                    align: 'center'
                });
            }
        },
    });
  }
  doc.save(`relatorio_anual_${mapName.toLowerCase().replace(' ', '_')}_${year}.pdf`);
}

export const exportAnnualToXlsx = (plan: RoutePlanRow[], technicians: Technician[], vehicles: Vehicle[], currentDate: any, mapName: string): void => {
  const year = currentDate.year();
  const worksheetData: any[] = [];
  
  plan.forEach(row => {
    if(row.type === 'route') {
      Object.keys(row.assignments).forEach(dateKey => {
        const assignmentDate = moment(dateKey);
        if(assignmentDate.year() === year) {
           const weekKey = assignmentDate.format('YYYY-WW');
           const weeklyData = row.weeklyData?.[weekKey] || EMPTY_WEEKLY_DATA;
           worksheetData.push({
             'Data': assignmentDate.format('DD/MM/YYYY'),
             'Rota': row.name,
             'Técnicos': getTechnicianNameList(row.assignments[dateKey].technicianIds, technicians),
             'Veículo': getVehicleName(weeklyData.vehicleId || '', vehicles),
             'Ferramentas': weeklyData.tools || '',
             'Observações': weeklyData.notes || '',
           });
        }
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData.sort((a,b) => moment(a.Data, 'DD/MM/YYYY').diff(moment(b.Data, 'DD/MM/YYYY'))));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Relatório ${year}`);
  worksheet['!cols'] = [{wch: 10}, {wch: 30}, {wch: 40}, {wch: 20}, {wch: 40}, {wch: 40}];
  XLSX.writeFile(workbook, `relatorio_anual_${mapName.toLowerCase().replace(' ', '_')}_${year}.xlsx`);
}
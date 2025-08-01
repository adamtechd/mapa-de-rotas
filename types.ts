export interface Technician {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  name: string;
}

// Represents the data stored for a specific week
export interface WeeklyData {
  tools: string;
  vehicleId: string;
  meta: string;
  notes: string;
}

// Represents a data row in the route map grid
export interface RouteData {
  type: 'route';
  id: string;
  name: string; // e.g., 'TRÊS PONTAS'
  assignments: {
    // Key is a date string in 'YYYY-MM-DD' format
    [dateKey: string]: { technicianIds: string[] };
  };
  weeklyData: {
    // Key is a week string in 'YYYY-WW' format
    [weekKey: string]: WeeklyData;
  };
}

// Represents a blue header row in the grid
export interface GroupHeader {
    type: 'group';
    id: string;
    name: string;
}

// A row in the plan can be either a group header or a route data row
export type RoutePlanRow = GroupHeader | RouteData;

// An object to hold multiple plans, keyed by a map identifier (e.g., 'MG')
export interface PlansData {
  [key: string]: RoutePlanRow[];
}

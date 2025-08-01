import { PlansData, Technician, Vehicle, RouteData } from '../types';

const PLANS_STORAGE_KEY = 'routePlannerPlansData_v2'; // Updated key for new structure
const TECHNICIANS_STORAGE_KEY = 'routePlannerTechnicians';
const VEHICLES_STORAGE_KEY = 'routePlannerVehicles';

// Plans for multiple maps
export const savePlans = (plans: PlansData): void => {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error("Error saving plans to localStorage", error);
  }
};

export const loadPlans = (): PlansData => {
  try {
    const data = localStorage.getItem(PLANS_STORAGE_KEY);
    const plans: PlansData = data ? JSON.parse(data) : {};

    // Migration logic from old data structure to new weekly data structure
    Object.keys(plans).forEach(mapKey => {
      plans[mapKey] = plans[mapKey].map(row => {
        if (row.type === 'route') {
          // If old properties exist (like `tools`), migrate the row.
          if (row.hasOwnProperty('tools')) {
            delete (row as any).tools;
            delete (row as any).vehicleId;
            delete (row as any).meta;
            delete (row as any).notes;
          }
          // Ensure all route rows have a weeklyData object.
          if (!row.hasOwnProperty('weeklyData')) {
            (row as RouteData).weeklyData = {};
          }
        }
        return row;
      });
    });

    return plans;
  } catch (error) {
    console.error("Error loading plans from localStorage", error);
    return {};
  }
};

// Technicians
export const saveTechnicians = (technicians: Technician[]): void => {
    try {
        localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(technicians));
    } catch (error) {
        console.error("Error saving technicians to localStorage", error);
    }
};

export const loadTechnicians = (): Technician[] => {
    try {
        const data = localStorage.getItem(TECHNICIANS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error)        {
        console.error("Error loading technicians from localStorage", error);
        return [];
    }
};

// Vehicles
export const saveVehicles = (vehicles: Vehicle[]): void => {
    try {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
        console.error("Error saving vehicles to localStorage", error);
    }
};

export const loadVehicles = (): Vehicle[] => {
    try {
        const data = localStorage.getItem(VEHICLES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error loading vehicles from localStorage", error);
        return [];
    }
};

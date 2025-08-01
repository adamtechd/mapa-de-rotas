import { Technician, Vehicle, PlansData, RoutePlanRow, RouteData, WeeklyData } from './types';

export const EMPTY_WEEKLY_DATA: WeeklyData = {
    tools: '',
    vehicleId: '',
    meta: '',
    notes: '',
};

export const TECHNICIANS: Technician[] = [
  // MG
  { id: 't-mg-1', name: 'CÉLIO BATALHA' },
  { id: 't-mg-2', name: 'CÉLIO ANTÔNIO' },
  { id: 't-mg-3', name: 'FELIPE THADEU' },
  { id: 't-mg-4', name: 'FELICIANO JOSÉ' },
  { id: 't-mg-5', name: 'MARCO ANTÔNIO' },
  { id: 't-mg-6', name: 'PEDRO LIMA' },
  // ES
  { id: 't-es-1', name: 'RODRIGO MATHIAS' },
  { id: 't-es-2', name: 'LUCAS SANTOS' },
  // TERCEIROS
  { id: 't-tr-1', name: 'EDUARDO SHIOMI' },
  { id: 't-tr-2', name: 'RODRIGO PEREIRA' },
  { id: 't-tr-3', name: 'MARCELO DOS SANTOS' },
  { id: 't-tr-4', name: 'ZÉ HENRIQUE' },
];

export const VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'HB20' },
  { id: 'v2', name: 'KWID' },
  { id: 'v3', name: 'PALIO' },
  { id: 'v4', name: 'FIAT FIORINO' },
  { id: 'v5', name: 'VW SAVEIRO' },
];

const emptyAssignments = {};

const createRoute = (name: string, idSuffix: string): RouteData => ({
    type: 'route',
    id: `r-mg-${idSuffix}`,
    name,
    assignments: emptyAssignments,
    weeklyData: {},
});

const regionsOfMG: { [key: string]: string[] } = {
    "Metropolitana de Belo Horizonte": [
        "SÃO JOAQUIM DE BICAS",
        "BETIM",
        "SETE LAGOAS",
        "LAGOA SANTA",
        "SEST SENAT",
        "QUELUZITO",
        "MARAVILHAS",
        "DOM JOAQUIM"
    ],
    "Vale do Rio Doce": [
        "ITABIRA ( FUNDAÇÃO)",
        "ITABIRA (ONCORP)",
        "JOÃO MONLEVADE (ONCORP)",
        "JOÃO MONLEVADE ( PREFEITURA)",
        "IPATINGA"
    ],
    "Zona da Mata": [
        "MANHUAÇU",
        "PEDRA DO ANTA",
        "JUIZ DE FORA"
    ],
    "Central Mineira": [
        "BIQUINHAS"
    ],
    "Oeste de Minas": [
        "NOVA SERRANA",
        "BAMBUÍ"
    ],
    "Noroeste de Minas": [
        "UNAÍ",
        "PARACATÚ"
    ],
    "Campo das Vertentes": [
        "SÃO JOÃO DEL REI"
    ],
    "Vale do Jequitinhonha": [
        "DIAMANTINA",
        "CONGONHAS DO NORTE",
        "FELÍCIO DOS SANTOS",
        "SERRA AZUL"
    ],
    "Sul de Minas": [
        "CAMPANHA"
    ],
    "Norte de Minas": [],
    "Triângulo Mineiro": [],
    "Vale do Mucuri": [],
};

let routeIdCounter = 1;
const mgPlan: RoutePlanRow[] = [];

Object.keys(regionsOfMG).forEach((regionName, index) => {
    // Add the group header
    mgPlan.push({
        type: 'group',
        id: `g-mg-${index + 1}`,
        name: regionName.toUpperCase()
    });

    // Add the routes for that region
    const cities = regionsOfMG[regionName];
    cities.forEach(city => {
        mgPlan.push(createRoute(city, `${routeIdCounter++}`));
    });
});


const esPlan: RoutePlanRow[] = [
    { type: 'group', id: 'g-es-1', name: 'ROTAS ESPIRITO SANTO' },
    {
        type: 'route',
        id: 'r-es-1',
        name: 'VITÓRIA',
        assignments: emptyAssignments,
        weeklyData: {},
    },
    {
        type: 'route',
        id: 'r-es-2',
        name: 'VILA VELHA',
        assignments: emptyAssignments,
        weeklyData: {},
    }
];


export const INITIAL_PLANS: PlansData = {
    'MG': mgPlan,
    'ES': esPlan,
};
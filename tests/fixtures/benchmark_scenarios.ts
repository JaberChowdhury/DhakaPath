import { PlanRequest } from '@/types/api';

export const benchmarkScenarios: { name: string; request: PlanRequest; expectedStatus: string; description: string }[] = [
  {
    name: 'Normal Multimodal Trip (Uttara North -> Motijheel)',
    request: {
      originHubId: 'hub_uttara_north',
      destinationHubId: 'hub_motijheel',
      student: false,
      budgetBdt: 120,
      avoidHubIds: [],
      allowedModes: ['metro', 'bus', 'leguna', 'rickshaw', 'walk'],
    },
    expectedStatus: 'OK',
    description: 'Fastest direct Metro MRT-6 from Uttara North to Motijheel terminus',
  },
  {
    name: 'Student Budget Journey (Mirpur 10 -> Shahbagh)',
    request: {
      originHubId: 'hub_mirpur_10',
      destinationHubId: 'hub_shahbagh',
      student: true,
      budgetBdt: 20,
      avoidHubIds: [],
      allowedModes: ['bus', 'metro', 'walk'],
    },
    expectedStatus: 'OK',
    description: 'Bikolpo Bus with statutory 50% student discount (13 BDT) fitting 20 BDT budget',
  },
  {
    name: 'Disruption Detour (Banasree -> Kawran Bazar via Gulshan Detour)',
    request: {
      originHubId: 'hub_banasree',
      destinationHubId: 'hub_kawran_bazar',
      student: false,
      budgetBdt: 100,
      avoidHubIds: [],
      scenarioId: 'disrupt_malibagh_waterlogging', // Malibagh Railgate closed
    },
    expectedStatus: 'OK',
    description: 'Avoids impassable Malibagh railgate via Leguna to Gulshan 1 and feeder to Kawran Bazar',
  },
  {
    name: 'Impossible Journey (Rampura Blockade with No Valid Route)',
    request: {
      originHubId: 'hub_banasree',
      destinationHubId: 'hub_gulshan_1',
      student: false,
      budgetBdt: 100,
      avoidHubIds: [],
      scenarioId: 'disrupt_rampura_blockade', // Feeder completely blocked
    },
    expectedStatus: 'NO_VALID_ROUTE',
    description: 'Engine returns honest NO_VALID_ROUTE rather than inventing a phantom road',
  },
];

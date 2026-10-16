// Precise street and road geometry for Dhaka Transit Corridors
// Snaps transit paths to actual roads, viaducts, and avenues from official CSV dataset
import {
  MRT_LINE_6_OFFICIAL_WAYPOINTS,
  BIKOLPO_BUS_OFFICIAL_WAYPOINTS,
  UTTARA_BUS_OFFICIAL_WAYPOINTS,
} from "./officialWaypoints";

export const MRT_LINE_6_ROAD_WAYPOINTS: [number, number][] =
  MRT_LINE_6_OFFICIAL_WAYPOINTS;
export const BIKOLPO_BUS_ROAD_WAYPOINTS: [number, number][] =
  BIKOLPO_BUS_OFFICIAL_WAYPOINTS;
export const UTTARA_BUS_ROAD_WAYPOINTS: [number, number][] =
  UTTARA_BUS_OFFICIAL_WAYPOINTS;

export const PROCHESTA_BUS_ROAD_WAYPOINTS: [number, number][] = [
  [23.852, 90.4075], // Airport Station
  [23.832, 90.417], // Khilkhet Overpass
  [23.815, 90.412], // Radisson Curve
  [23.793, 90.4045], // Banani Kakoli
  [23.782, 90.402], // Chairmanbari
  [23.7775, 90.4005], // Mohakhali Bus Terminal
  [23.764, 90.398], // Shaheen College
  [23.752, 90.404], // Mogbazar Flyover ramp
  [23.749, 90.4085], // Moghbazar Wireless
  [23.747, 90.4145], // Malibagh Railgate
  [23.745, 90.412], // Mouchak Market
  [23.739, 90.411], // Shantinagar / Kakrail
  [23.734, 90.414], // Bijoynagar
  [23.732, 90.418], // Motijheel Shapla Chottor
];

export const BANASREE_LEGUNA_ROAD_WAYPOINTS: [number, number][] = [
  [23.763, 90.435], // Banasree Block C
  [23.7615, 90.429], // Banasree Main Road
  [23.761, 90.426], // Rampura Bridge
  [23.7645, 90.422], // Hatirjheel South Lake Road
  [23.768, 90.419], // Hatirjheel Viaduct 2
  [23.772, 90.416], // Police Plaza Concord
  [23.778, 90.4165], // Gulshan 1 Circle
];

export const GULSHAN_MOHAKHALI_ROAD_WAYPOINTS: [number, number][] = [
  [23.778, 90.4165], // Gulshan 1 Circle
  [23.778, 90.409], // Shooting Club Road (Bir Uttam Mir Shawkat Sarak)
  [23.7775, 90.4005], // Mohakhali Interchange
];

export const MOHAKHALI_KAWRAN_ROAD_WAYPOINTS: [number, number][] = [
  [23.7775, 90.4005], // Mohakhali Flyover
  [23.769, 90.396], // Jahangir Gate
  [23.761, 90.392], // Bijoy Sarani Link
  [23.757, 90.3885], // Farmgate
  [23.751, 90.394], // Karwan Bazar
];

// Helper to extract a sub-path along a waypoint chain closest to start and end
export function extractSubPath(
  chain: [number, number][],
  startCoord: [number, number],
  endCoord: [number, number],
): [number, number][] {
  let startIndex = 0;
  let endIndex = chain.length - 1;
  let minStartDist = Infinity;
  let minEndDist = Infinity;

  chain.forEach((pt, i) => {
    const dStart = Math.hypot(pt[0] - startCoord[0], pt[1] - startCoord[1]);
    const dEnd = Math.hypot(pt[0] - endCoord[0], pt[1] - endCoord[1]);

    if (dStart < minStartDist) {
      minStartDist = dStart;
      startIndex = i;
    }
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      endIndex = i;
    }
  });

  if (startIndex <= endIndex) {
    return [startCoord, ...chain.slice(startIndex, endIndex + 1), endCoord];
  } else {
    const reversed = [...chain.slice(endIndex, startIndex + 1)].reverse();
    return [startCoord, ...reversed, endCoord];
  }
}

export function getRoadPolylineForLeg(
  fromCoord: [number, number],
  toCoord: [number, number],
  mode: string,
  serviceId: string | null,
): [number, number][] {
  if (mode === "metro" || serviceId === "srv_mrt_line_6") {
    return extractSubPath(MRT_LINE_6_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === "srv_bus_bikolpo") {
    return extractSubPath(BIKOLPO_BUS_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === "srv_bus_uttara") {
    return extractSubPath(UTTARA_BUS_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === "srv_bus_prochesta") {
    return extractSubPath(PROCHESTA_BUS_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === "srv_leguna_banasree_gulshan") {
    return extractSubPath(BANASREE_LEGUNA_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  // Cross-connection checks for detours
  const isGulshanToMohakhali =
    (Math.abs(fromCoord[0] - 23.778) < 0.01 &&
      Math.abs(toCoord[0] - 23.7775) < 0.01) ||
    (Math.abs(fromCoord[0] - 23.7775) < 0.01 &&
      Math.abs(toCoord[0] - 23.778) < 0.01);

  if (isGulshanToMohakhali) {
    return extractSubPath(GULSHAN_MOHAKHALI_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  const isMohakhaliToKawran =
    (Math.abs(fromCoord[0] - 23.7775) < 0.01 &&
      Math.abs(toCoord[0] - 23.751) < 0.01) ||
    (Math.abs(fromCoord[0] - 23.751) < 0.01 &&
      Math.abs(toCoord[0] - 23.7775) < 0.01);

  if (isMohakhaliToKawran) {
    return extractSubPath(MOHAKHALI_KAWRAN_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  // Default direct line for short walks / connectors
  return [fromCoord, toCoord];
}

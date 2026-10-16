// Precise street and road geometry for Dhaka Transit Corridors
// Snaps transit paths to actual roads, viaducts, and avenues instead of straight chords

export const MRT_LINE_6_ROAD_WAYPOINTS: [number, number][] = [
  [23.8748, 90.3982], // Uttara North Terminal
  [23.8640, 90.3965], // Uttara Center
  [23.8540, 90.3890], // Uttara South
  [23.8240, 90.3645], // Pallabi
  [23.8160, 90.3655], // Mirpur 11
  [23.8070, 90.3685], // Mirpur 10 Circle
  [23.7990, 90.3725], // Kazipara
  [23.7900, 90.3755], // Shewrapara
  [23.7780, 90.3795], // Agargaon Pass
  [23.7665, 90.3820], // Chandrima Udyan / Crescent Lake
  [23.7605, 90.3845], // Bijoy Sarani
  [23.7570, 90.3885], // Farmgate
  [23.7510, 90.3940], // Karwan Bazar
  [23.7445, 90.3955], // Bangla Motor
  [23.7380, 90.3965], // Shahbagh Circle
  [23.7340, 90.4010], // Dhaka University / Curzon Hall
  [23.7330, 90.4070], // Secretariat
  [23.7325, 90.4120], // Paltan intersection
  [23.7320, 90.4180], // Motijheel Shapla Chottor
];

export const BIKOLPO_BUS_ROAD_WAYPOINTS: [number, number][] = [
  [23.8070, 90.3685], // Mirpur 10 Circle
  [23.7990, 90.3725], // Kazipara (Rokeya Sarani)
  [23.7900, 90.3755], // Shewrapara
  [23.7780, 90.3795], // Agargaon Bus Stand
  [23.7680, 90.3825], // Planning Commission
  [23.7610, 90.3850], // Khamarbari
  [23.7570, 90.3885], // Farmgate Overpass
  [23.7510, 90.3940], // Karwan Bazar Kazi Nazrul Islam Ave
  [23.7450, 90.3955], // Bangla Motor
  [23.7380, 90.3965], // Shahbagh Bus Stand
  [23.7340, 90.4030], // High Court Gate
  [23.7325, 90.4120], // GPO / Paltan
  [23.7320, 90.4180], // Motijheel Shapla Chottor
];

export const PROCHESTA_BUS_ROAD_WAYPOINTS: [number, number][] = [
  [23.8520, 90.4075], // Airport Station
  [23.8320, 90.4170], // Khilkhet Overpass
  [23.8150, 90.4120], // Radisson Curve
  [23.7930, 90.4045], // Banani Kakoli
  [23.7820, 90.4020], // Chairmanbari
  [23.7775, 90.4005], // Mohakhali Bus Terminal
  [23.7640, 90.3980], // Shaheen College
  [23.7520, 90.4040], // Mogbazar Flyover ramp
  [23.7490, 90.4085], // Moghbazar Wireless
  [23.7470, 90.4145], // Malibagh Railgate
  [23.7450, 90.4120], // Mouchak Market
  [23.7390, 90.4110], // Shantinagar / Kakrail
  [23.7340, 90.4140], // Bijoynagar
  [23.7320, 90.4180], // Motijheel Shapla Chottor
];

export const BANASREE_LEGUNA_ROAD_WAYPOINTS: [number, number][] = [
  [23.7630, 90.4350], // Banasree Block C
  [23.7615, 90.4290], // Banasree Main Road
  [23.7610, 90.4260], // Rampura Bridge
  [23.7645, 90.4220], // Hatirjheel South Lake Road
  [23.7680, 90.4190], // Hatirjheel Viaduct 2
  [23.7720, 90.4160], // Police Plaza Concord
  [23.7780, 90.4165], // Gulshan 1 Circle
];

export const GULSHAN_MOHAKHALI_ROAD_WAYPOINTS: [number, number][] = [
  [23.7780, 90.4165], // Gulshan 1 Circle
  [23.7780, 90.4090], // Shooting Club Road (Bir Uttam Mir Shawkat Sarak)
  [23.7775, 90.4005], // Mohakhali Interchange
];

export const MOHAKHALI_KAWRAN_ROAD_WAYPOINTS: [number, number][] = [
  [23.7775, 90.4005], // Mohakhali Flyover
  [23.7690, 90.3960], // Jahangir Gate
  [23.7610, 90.3920], // Bijoy Sarani Link
  [23.7570, 90.3885], // Farmgate
  [23.7510, 90.3940], // Karwan Bazar
];

// Helper to extract a sub-path along a waypoint chain closest to start and end
export function extractSubPath(
  chain: [number, number][],
  startCoord: [number, number],
  endCoord: [number, number]
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
  serviceId: string | null
): [number, number][] {
  if (mode === 'metro' || serviceId === 'srv_mrt_line_6') {
    return extractSubPath(MRT_LINE_6_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === 'srv_bus_bikolpo') {
    return extractSubPath(BIKOLPO_BUS_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === 'srv_bus_prochesta') {
    return extractSubPath(PROCHESTA_BUS_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  if (serviceId === 'srv_leguna_banasree_gulshan') {
    return extractSubPath(BANASREE_LEGUNA_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  // Cross-connection checks for detours
  const isGulshanToMohakhali =
    (Math.abs(fromCoord[0] - 23.7780) < 0.01 && Math.abs(toCoord[0] - 23.7775) < 0.01) ||
    (Math.abs(fromCoord[0] - 23.7775) < 0.01 && Math.abs(toCoord[0] - 23.7780) < 0.01);

  if (isGulshanToMohakhali) {
    return extractSubPath(GULSHAN_MOHAKHALI_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  const isMohakhaliToKawran =
    (Math.abs(fromCoord[0] - 23.7775) < 0.01 && Math.abs(toCoord[0] - 23.7510) < 0.01) ||
    (Math.abs(fromCoord[0] - 23.7510) < 0.01 && Math.abs(toCoord[0] - 23.7775) < 0.01);

  if (isMohakhaliToKawran) {
    return extractSubPath(MOHAKHALI_KAWRAN_ROAD_WAYPOINTS, fromCoord, toCoord);
  }

  // Default direct line for short walks / connectors
  return [fromCoord, toCoord];
}

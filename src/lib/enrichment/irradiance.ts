/**
 * Typical UK rooftop PV yield (kWh/kWp/year) by postcode area.
 * Values are rounded regional averages (PVGIS-style), not site-specific.
 * Always treated as ESTIMATED — never as verified survey data.
 */

export type IrradianceLookup = {
  kwhPerKwp: number;
  region: string;
  postcodeArea: string;
};

const AREA_YIELD: Record<string, { kwhPerKwp: number; region: string }> = {
  TR: { kwhPerKwp: 1100, region: "Cornwall / far South West" },
  PL: { kwhPerKwp: 1080, region: "Plymouth / Devon" },
  TQ: { kwhPerKwp: 1070, region: "Torbay" },
  EX: { kwhPerKwp: 1050, region: "Exeter / Devon" },
  TA: { kwhPerKwp: 1040, region: "Somerset" },
  DT: { kwhPerKwp: 1050, region: "Dorset" },
  BH: { kwhPerKwp: 1050, region: "Bournemouth" },
  SO: { kwhPerKwp: 1040, region: "Southampton / Hampshire" },
  PO: { kwhPerKwp: 1050, region: "Portsmouth / Isle of Wight" },
  BN: { kwhPerKwp: 1050, region: "Brighton / Sussex" },
  TN: { kwhPerKwp: 1040, region: "Tunbridge Wells / Kent" },
  CT: { kwhPerKwp: 1050, region: "Canterbury / Kent coast" },
  ME: { kwhPerKwp: 1030, region: "Medway" },
  SS: { kwhPerKwp: 1030, region: "Southend" },
  CO: { kwhPerKwp: 1020, region: "Colchester / Essex" },
  IP: { kwhPerKwp: 1020, region: "Ipswich / Suffolk" },
  NR: { kwhPerKwp: 1010, region: "Norwich / Norfolk" },
  CB: { kwhPerKwp: 1010, region: "Cambridge" },
  PE: { kwhPerKwp: 1000, region: "Peterborough / Fens" },
  CM: { kwhPerKwp: 1020, region: "Chelmsford" },
  RM: { kwhPerKwp: 1020, region: "Romford / East London" },
  IG: { kwhPerKwp: 1010, region: "Ilford" },
  E: { kwhPerKwp: 1010, region: "East London" },
  SE: { kwhPerKwp: 1010, region: "South East London" },
  SW: { kwhPerKwp: 1010, region: "South West London" },
  W: { kwhPerKwp: 1010, region: "West London" },
  NW: { kwhPerKwp: 1000, region: "North West London" },
  N: { kwhPerKwp: 1000, region: "North London" },
  EC: { kwhPerKwp: 1010, region: "City of London" },
  WC: { kwhPerKwp: 1010, region: "West Central London" },
  KT: { kwhPerKwp: 1020, region: "Kingston" },
  TW: { kwhPerKwp: 1020, region: "Twickenham" },
  UB: { kwhPerKwp: 1010, region: "Uxbridge" },
  HA: { kwhPerKwp: 1010, region: "Harrow" },
  EN: { kwhPerKwp: 1000, region: "Enfield" },
  AL: { kwhPerKwp: 1000, region: "St Albans" },
  WD: { kwhPerKwp: 1000, region: "Watford" },
  LU: { kwhPerKwp: 990, region: "Luton" },
  MK: { kwhPerKwp: 1000, region: "Milton Keynes" },
  HP: { kwhPerKwp: 1000, region: "Hemel Hempstead" },
  SL: { kwhPerKwp: 1020, region: "Slough / Thames Valley" },
  RG: { kwhPerKwp: 1020, region: "Reading" },
  OX: { kwhPerKwp: 1010, region: "Oxford" },
  SN: { kwhPerKwp: 1020, region: "Swindon" },
  GL: { kwhPerKwp: 1010, region: "Gloucester" },
  BS: { kwhPerKwp: 1030, region: "Bristol" },
  BA: { kwhPerKwp: 1030, region: "Bath" },
  SP: { kwhPerKwp: 1030, region: "Salisbury" },
  GU: { kwhPerKwp: 1020, region: "Guildford" },
  RH: { kwhPerKwp: 1030, region: "Redhill / Surrey" },
  CR: { kwhPerKwp: 1020, region: "Croydon" },
  SM: { kwhPerKwp: 1020, region: "Sutton" },
  BR: { kwhPerKwp: 1020, region: "Bromley" },
  DA: { kwhPerKwp: 1020, region: "Dartford" },
  CF: { kwhPerKwp: 1000, region: "Cardiff / South Wales" },
  NP: { kwhPerKwp: 980, region: "Newport / Gwent" },
  SA: { kwhPerKwp: 990, region: "Swansea / West Wales" },
  LD: { kwhPerKwp: 960, region: "Llandrindod / mid Wales" },
  SY: { kwhPerKwp: 960, region: "Shrewsbury / Welsh Borders" },
  HR: { kwhPerKwp: 990, region: "Hereford" },
  WR: { kwhPerKwp: 990, region: "Worcester" },
  B: { kwhPerKwp: 980, region: "Birmingham / West Midlands" },
  CV: { kwhPerKwp: 990, region: "Coventry" },
  WS: { kwhPerKwp: 970, region: "Walsall" },
  WV: { kwhPerKwp: 970, region: "Wolverhampton" },
  DY: { kwhPerKwp: 980, region: "Dudley" },
  ST: { kwhPerKwp: 960, region: "Stoke-on-Trent" },
  TF: { kwhPerKwp: 970, region: "Telford" },
  NN: { kwhPerKwp: 990, region: "Northampton" },
  LE: { kwhPerKwp: 980, region: "Leicester" },
  NG: { kwhPerKwp: 970, region: "Nottingham" },
  DE: { kwhPerKwp: 970, region: "Derby" },
  LN: { kwhPerKwp: 980, region: "Lincoln" },
  DN: { kwhPerKwp: 950, region: "Doncaster" },
  S: { kwhPerKwp: 950, region: "Sheffield" },
  HD: { kwhPerKwp: 930, region: "Huddersfield" },
  HX: { kwhPerKwp: 920, region: "Halifax" },
  WF: { kwhPerKwp: 930, region: "Wakefield" },
  LS: { kwhPerKwp: 930, region: "Leeds" },
  BD: { kwhPerKwp: 920, region: "Bradford" },
  HG: { kwhPerKwp: 920, region: "Harrogate" },
  YO: { kwhPerKwp: 940, region: "York" },
  HU: { kwhPerKwp: 950, region: "Hull" },
  M: { kwhPerKwp: 920, region: "Manchester" },
  OL: { kwhPerKwp: 910, region: "Oldham" },
  BL: { kwhPerKwp: 910, region: "Bolton" },
  WN: { kwhPerKwp: 910, region: "Wigan" },
  SK: { kwhPerKwp: 930, region: "Stockport" },
  WA: { kwhPerKwp: 930, region: "Warrington" },
  L: { kwhPerKwp: 920, region: "Liverpool" },
  CH: { kwhPerKwp: 940, region: "Chester / Wirral" },
  CW: { kwhPerKwp: 950, region: "Crewe" },
  PR: { kwhPerKwp: 900, region: "Preston" },
  BB: { kwhPerKwp: 890, region: "Blackburn" },
  FY: { kwhPerKwp: 900, region: "Blackpool" },
  LA: { kwhPerKwp: 900, region: "Lancaster" },
  CA: { kwhPerKwp: 880, region: "Carlisle / Cumbria" },
  DL: { kwhPerKwp: 890, region: "Darlington" },
  TS: { kwhPerKwp: 890, region: "Teesside" },
  DH: { kwhPerKwp: 880, region: "Durham" },
  SR: { kwhPerKwp: 870, region: "Sunderland" },
  NE: { kwhPerKwp: 870, region: "Newcastle / North East" },
  EH: { kwhPerKwp: 880, region: "Edinburgh" },
  FK: { kwhPerKwp: 860, region: "Falkirk" },
  G: { kwhPerKwp: 860, region: "Glasgow" },
  PA: { kwhPerKwp: 850, region: "Paisley / west Scotland" },
  KA: { kwhPerKwp: 860, region: "Kilmarnock / Ayrshire" },
  ML: { kwhPerKwp: 850, region: "Motherwell" },
  DD: { kwhPerKwp: 870, region: "Dundee" },
  KY: { kwhPerKwp: 870, region: "Kirkcaldy / Fife" },
  AB: { kwhPerKwp: 850, region: "Aberdeen" },
  IV: { kwhPerKwp: 820, region: "Inverness / Highlands" },
  PH: { kwhPerKwp: 840, region: "Perthshire" },
  KW: { kwhPerKwp: 800, region: "Wick / far north" },
  ZE: { kwhPerKwp: 760, region: "Shetland" },
  HS: { kwhPerKwp: 780, region: "Western Isles" },
  BT: { kwhPerKwp: 880, region: "Northern Ireland" },
};

function extractPostcodeArea(postcode: string): string | null {
  const cleaned = postcode.trim().toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2})\d/);
  return match ? match[1] : null;
}

export function lookupIrradiance(postcode: string | null | undefined): IrradianceLookup | null {
  if (!postcode) return null;
  const area = extractPostcodeArea(postcode);
  if (!area) return null;
  const hit = AREA_YIELD[area];
  if (!hit) return null;
  return {
    kwhPerKwp: hit.kwhPerKwp,
    region: hit.region,
    postcodeArea: area,
  };
}

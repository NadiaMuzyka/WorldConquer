// Mappa delle connessioni: KEY = Paese, VALUE = Array di paesi confinanti
const RISK_ADJACENCY = {
  // --- NORD AMERICA ---
  ALK: ['TNO', 'ALB', 'KMK'], // Alaska -> Connette anche a Kamchatka (KMK)
  ALB: ['ALK', 'TNO', 'ONT', 'US_OCC'], // Alberta
  AM_CEN: ['US_OCC', 'US_OR', 'VZL'], // America Centrale
  US_OR: ['US_OCC', 'ONT', 'QUE', 'AM_CEN'], // Stati Uniti Orientali
  GNL: ['TNO', 'ONT', 'QUE', 'ISL'], // Groenlandia
  TNO: ['ALK', 'ALB', 'ONT', 'GNL'], // Territori del Nord Ovest
  ONT: ['TNO', 'ALB', 'US_OCC', 'US_OR', 'QUE', 'GNL'], // Ontario
  QUE: ['ONT', 'US_OR', 'GNL'], // Quebec
  US_OCC: ['ALB', 'ONT', 'US_OR', 'AM_CEN'], // Stati Uniti Occidentali

  // --- SUD AMERICA ---
  ARG: ['PRU', 'BRA'], // Argentina
  BRA: ['VZL', 'PRU', 'ARG', 'AF_SETT'], // Brasile -> Connette anche a Africa del Nord (AF_SETT)
  PRU: ['VZL', 'BRA', 'ARG'], // Perù
  VZL: ['AM_CEN', 'BRA', 'PRU'], // Venezuela

  // --- EUROPA ---
  GBR: ['ISL', 'SCA', 'EU_SET', 'EU_OCC'], // Gran Bretagna
  ISL: ['GNL', 'GBR', 'SCA'], // Islanda
  EU_SET: ['GBR', 'SCA', 'UKR', 'EU_MER', 'EU_OCC'], // Europa Settentrionale
  SCA: ['ISL', 'GBR', 'EU_SET', 'UKR'], // Scandinavia
  EU_MER: ['EU_SET', 'EU_OCC', 'UKR', 'AF_SETT', 'EGY', 'MOR'], // Europa Meridionale
  UKR: ['SCA', 'EU_SET', 'EU_MER', 'URL', 'AFG', 'MOR'], // Ucraina
  EU_OCC: ['GBR', 'EU_SET', 'EU_MER', 'AF_SETT'], // Europa Occidentale

  // --- AFRICA ---
  CNG: ['AF_SETT', 'AF_OR', 'AF_MER'], // Congo
  AF_OR: ['EGY', 'AF_SETT', 'CNG', 'AF_MER', 'MGR', 'MOR'], // Africa Orientale
  EGY: ['AF_SETT', 'AF_OR', 'EU_MER', 'MOR'], // Egitto
  MGR: ['AF_OR', 'AF_MER'], // Madagascar
  AF_SETT: ['BRA', 'EU_OCC', 'EU_MER', 'EGY', 'AF_OR', 'CNG'], // Africa del Nord -> Connette a Brasile (BRA)
  AF_MER: ['CNG', 'AF_OR', 'MGR'], // Africa del Sud

  // --- ASIA ---
  AFG: ['UKR', 'URL', 'CHN', 'IND', 'MOR'], // Afghanistan
  CHN: ['SIAM', 'IND', 'AFG', 'URL', 'SBR', 'MON'], // Cina
  IND: ['MOR', 'AFG', 'CHN', 'SIAM'], // India
  JCZ: ['SBR', 'CITA', 'KMK'], // Jacuzia
  JPN: ['KMK', 'MON'], // Giappone
  KMK: ['JCZ', 'CITA', 'MON', 'JPN', 'ALK'], // Kamchatka -> Connette a Alaska (ALK)
  MOR: ['EGY', 'AF_OR', 'EU_MER', 'UKR', 'AFG', 'IND'], // Medio Oriente
  MON: ['CHN', 'SBR', 'CITA', 'KMK', 'JPN'], // Mongolia
  SIAM: ['IND', 'CHN', 'IDN'], // Siam
  SBR: ['URL', 'CHN', 'MON', 'CITA', 'JCZ'], // Siberia
  URL: ['UKR', 'AFG', 'CHN', 'SBR'], // Urali
  CITA: ['SBR', 'MON', 'KMK', 'JCZ'], // Cita (Irkutsk)

  // --- OCEANIA ---
  AU_OR: ['AU_OCC', 'NGU'], // Australia Orientale
  IDN: ['SIAM', 'NGU', 'AU_OCC'], // Indonesia
  NGU: ['IDN', 'AU_OR', 'AU_OCC'], // Nuova Guinea -> Nota: Nel Risiko classico spesso si connette a AU_OR e AU_OCC
  AU_OCC: ['IDN', 'NGU', 'AU_OR'] // Australia Occidentale
};

module.exports = { RISK_ADJACENCY };
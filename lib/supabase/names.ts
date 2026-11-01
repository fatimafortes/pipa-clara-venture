// Pipa Clara shares the Supabase project "semestre" with other course apps,
// so every table and the photo bucket carry the pc_ prefix. Always import names from here.
export const TABLES = {
  cisterns: "pc_cisterns",
  deliveries: "pc_deliveries",
  readings: "pc_readings",
  shares: "pc_shares",
  challenges: "pc_challenges",
} as const;

export const PHOTO_BUCKET = "pc_readings";

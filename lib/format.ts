// Spanish (Mexico) formatting. The server runs in UTC, so dates and times
// always use the organizer's time zone explicitly.
const TIME_ZONE = "America/Mexico_City";

const number = new Intl.NumberFormat("es-MX");

// "9,750": for ranges, where the unit is said once at the end
export function formatNumber(value: number): string {
  return number.format(value);
}

export function formatLiters(liters: number): string {
  return `${number.format(liters)} L`;
}

// "300 litros": for sentences, where "±300 L" read like a code to the persona test
export function formatLitersWord(liters: number): string {
  return `${number.format(liters)} litros`;
}

// Whole pesos stay whole ("$1,800"); cents always show two digits ("$19.80", never "$19.8")
const cents = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMxn(pesos: number): string {
  return `$${Number.isInteger(pesos) ? number.format(pesos) : cents.format(pesos)}`;
}

// "25 de octubre"
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: TIME_ZONE }).format(
    new Date(iso),
  );
}

// "08:02"
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

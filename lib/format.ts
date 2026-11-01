// Spanish (Mexico) formatting. The server runs in UTC, so dates and times
// always use the organizer's time zone explicitly.
const TIME_ZONE = "America/Mexico_City";

const number = new Intl.NumberFormat("es-MX");

export function formatLiters(liters: number): string {
  return `${number.format(liters)} L`;
}

// "300 litros": for sentences, where "±300 L" read like a code to the persona test
export function formatLitersWord(liters: number): string {
  return `${number.format(liters)} litros`;
}

export function formatMxn(pesos: number): string {
  return `$${number.format(pesos)}`;
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

// The week's required real pricing conversation (Blueprint condition 2): each state is
// logged separately, because "said yes" is not "paid". Roles only, never names.
export type ConversationState =
  | "planned" // question ready, not asked yet
  | "asked"
  | "said_yes"
  | "said_no"
  | "approved_in_writing"
  | "paid"
  | "renewed";

export const STATE_LABEL: Record<ConversationState, string> = {
  planned: "Por preguntar",
  asked: "Preguntó",
  said_yes: "Dijo que sí",
  said_no: "Dijo que no",
  approved_in_writing: "Aprobó por escrito",
  paid: "Pagó",
  renewed: "Renovó",
};

export type Conversation = {
  role: string;
  segment: "Familias" | "Negocios";
  date: string | null; // ISO day, null while planned
  question: string;
  priceAskedMxn: number | null;
  answer: string | null; // exact words, in Spanish
  whatItMeans: string | null; // founder's reading, kept apart from what they said
  states: ConversationState[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    role: "Encargado de una fonda familiar; compra pipa privada de 10,000 L y lleva las compras del local",
    segment: "Negocios",
    date: "2026-11-15",
    question:
      "¿Qué valdría para ti saber exactamente cuántos litros entraron, y cuándo te vas a quedar sin agua? ¿Pagarías $20 por pipa por eso? ¿Y $50?",
    priceAskedMxn: 20,
    answer:
      "Sí me serviría bastante, sobre todo para organizarme. Así sabría cuánto agua tengo realmente y cuándo tengo que pedir otra pipa. […] Pues sí, $20 no se me hace mucho si de verdad funciona y me da esa información. […] Ahí ya lo pensaría un poquito más, pero si me demuestra que la pipa me está entregando menos agua de la que estoy pagando, sí los pagaría.",
    whatItMeans:
      "Dijo que sí a $20, condicionado a que funcione; todavía no aprueba ni paga. Por esta respuesta, $20 es ahora el precio de prueba para negocios (antes $2). Lo primero que nombró no fue el faltante sino organizarse: saber cuánta agua tiene y cuándo pedir otra pipa. En un mes normal compró 2 pipas de $1,500, no 13: el simulador ya usa esos números. A $50 solo paga si se demuestra un faltante, así que ese precio depende de las primeras pipas medidas.",
    states: ["asked", "said_yes"],
  },
  {
    role: "Chofer de pipa particular de 10,000 L; entrega a casas, comercios y vecindades",
    segment: "Familias",
    date: "2026-11-15",
    question: "¿Aceptarías que te paguen después de medir, por los litros que entraron?",
    priceAskedMxn: null,
    answer:
      "Pues sí, siempre y cuando sea una medición justa. […] Me preocuparía que por un error de medición me quieran pagar menos. […] Si tengo fotos, horarios y registros de las entregas, sería una buena manera de respaldarme.",
    whatItMeans:
      "No es quien paga, pero acepta cobrar después de medir: ya le pagan casi siempre al terminar. Su miedo es el error de medición (cisternas de otras formas, fugas, alguien usando agua mientras descarga). Pipa Clara ya responde a eso: cada veredicto lleva su margen, un resultado dentro del margen cuenta como entrega completa y, si la bomba al tinaco estuvo prendida, no hay veredicto. Y quiere el registro de entregas completas: el pipero honesto como socio sí tiene interés.",
    states: ["asked", "said_yes"],
  },
];

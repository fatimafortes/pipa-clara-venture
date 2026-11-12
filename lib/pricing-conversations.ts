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
    role: "Dueña o encargado de una fonda o tortillería que compró pipa privada este año",
    segment: "Negocios",
    date: null,
    question:
      "¿Qué valdría para ti saber exactamente cuántos litros entraron, y cuándo te vas a quedar sin agua? ¿Cuántas pipas compraste el mes pasado, sin crisis?",
    priceAskedMxn: null,
    answer: null,
    whatItMeans: null,
    states: ["planned"],
  },
  {
    role: "Pipero que entrega a cisternas compartidas",
    segment: "Familias",
    date: null,
    question: "¿Aceptarías que te paguen después de medir, por los litros que entraron?",
    priceAskedMxn: null,
    answer: null,
    whatItMeans: null,
    states: ["planned"],
  },
];

/**
 * Définitions partagées des partenariats — importées par le formulaire client
 * ET par la route API (validation serveur). Aucun import serveur ici.
 */

export type AllianceTypeId =
  | "communaute"
  | "createur"
  | "evenementiel"
  | "autre";

export type AllianceTypeDefinition = {
  id: AllianceTypeId;
  num: string;
  label: string;
  /** Libellé court pour le select / les tickets. */
  shortLabel: string;
  /** Si vrai, le champ site / réseau / serveur est requis. */
  presenceRequired: boolean;
};

export const ALLIANCE_TYPES: AllianceTypeDefinition[] = [
  {
    id: "communaute",
    num: "01",
    label: "Serveurs & communautés",
    shortLabel: "Communauté",
    presenceRequired: true,
  },
  {
    id: "createur",
    num: "02",
    label: "Créateurs de contenu",
    shortLabel: "Créateur",
    presenceRequired: true,
  },
  {
    id: "evenementiel",
    num: "03",
    label: "Événementiel",
    shortLabel: "Event",
    presenceRequired: false,
  },
  {
    id: "autre",
    num: "04",
    label: "Autre / à préciser",
    shortLabel: "Autre",
    presenceRequired: false,
  },
];

export const NAME_MAX_LENGTH = 80;
export const DISCORD_MAX_LENGTH = 80;
export const PRESENCE_MAX_LENGTH = 200;
export const MESSAGE_MIN_LENGTH = 40;
export const MESSAGE_MAX_LENGTH = 2000;

export function getAllianceTypeById(id: string): AllianceTypeDefinition | undefined {
  return ALLIANCE_TYPES.find((type) => type.id === id);
}

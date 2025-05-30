export enum EntityDomain {
  Land = "Land",
  Air = "Air",
  Sea = "Sea",
  Space = "Space",
  Subsurface = "Subsurface",
  Cyber = "Cyber",
}

export const EntityDomainDescriptions: Record<EntityDomain, string> = {
  [EntityDomain.Land]: "Land",
  [EntityDomain.Air]: "Air",
  [EntityDomain.Sea]: "Sea",
  [EntityDomain.Space]: "Space",
  [EntityDomain.Subsurface]: "Subsurface",
  [EntityDomain.Cyber]: "Cyber",
};

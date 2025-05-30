export enum EntityDomain {
  Other = 0,
  Land = 1,
  Air = 2,
  Sea = 3,
  Space = 4,
  Subsurface = 5,
  Cyber = 6,
}

export const EntityDomainDescriptions: Record<EntityDomain, string> = {
  [EntityDomain.Other]: "Other",
  [EntityDomain.Land]: "Land",
  [EntityDomain.Air]: "Air",
  [EntityDomain.Sea]: "Sea",
  [EntityDomain.Space]: "Space",
  [EntityDomain.Subsurface]: "Subsurface",
  [EntityDomain.Cyber]: "Cyber",
};

export function createEntityDomainFromNumber(val: number): EntityDomain | undefined {
  return Number.isFinite(val) && val >= 0 && val <= 6 ? EntityDomain[val as unknown as keyof typeof EntityDomain] : undefined;
}

export function getEntityDomainDescription(domain: EntityDomain): string {
  return EntityDomainDescriptions[domain];
}

export function createEntityDomainFromString(name: string): EntityDomain | undefined {
  for (const [key, value] of Object.entries(EntityDomainDescriptions)) {
    if (value.toLowerCase() === name.toLowerCase()) {
      return Number(key) as EntityDomain;
    }
  }
  return undefined;
}

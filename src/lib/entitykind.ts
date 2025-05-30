export enum EntityKind {
  Other = "Other",
  Platform = "Platform",
  Munition = "Munition",
  LifeForm = "LifeForm",
  Environmental = "Environmental",
  CulturalFeature = "CulturalFeature",
  Supply = "Supply",
  Radio = "Radio",
  Expendable = "Expendable",
  SensorEmitter = "SensorEmitter",
}

export const EntityKindDescriptions: Record<EntityKind, string> = {
  [EntityKind.Other]: "Other",
  [EntityKind.Platform]: "Platform",
  [EntityKind.Munition]: "Munition",
  [EntityKind.LifeForm]: "Life form",
  [EntityKind.Environmental]: "Environmental",
  [EntityKind.CulturalFeature]: "Cultural feature",
  [EntityKind.Supply]: "Supply",
  [EntityKind.Radio]: "Radio",
  [EntityKind.Expendable]: "Expendable",
  [EntityKind.SensorEmitter]: "Sensor/Emitter",
};

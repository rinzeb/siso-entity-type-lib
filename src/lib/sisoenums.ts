import { EntityKind } from "./entitykind.js";
import { EntityDomain } from "./entitydomain.js";
import { XMLBuilder } from "fast-xml-parser";
import debugEsm from "debug";

import type {
  CategoryElement,
  EntityElement,
  Enum,
  FluffySpecific,
  JammerKind,
  PurpleEntity,
  PurpleSpecific,
  PurpleSubcategory,
  SISOXMLTypes,
  StickySpecific,
  SubcategoryClass,
  SubcategoryElement,
  TentacledSpecific,
} from "../generated/siso-xml-types.js";
import { toBigInt, toNumber } from "./utils.js";

type AllSpecificTypes = StickySpecific | PurpleSpecific | FluffySpecific | TentacledSpecific;

const debug = debugEsm("SISO:enums");

export interface SisoEnumType {
  uid: number; // Unique identifier for the enumeration
  kind: EntityKind; // High-level classification (e.g., Platform, Munition)
  domain?: EntityDomain; // Operational domain (e.g., Land, Air, Sea)
  category?: string; // Specific category within the domain
  subCategory?: string; // Optional subcategory
  specific?: string; // Optional specific type
  extra?: string; // Optional extra detail
  description: string; // Human-readable description
  fullName?: string; // Optional full name or label
  version?: string; // Version of the enumeration
  country?: string; // Country code or name if applicable

  toString(): string;
}

// UIDs
const UID_ENTITYKIND = 7;
const UID_OTHERKIND_DOMAIN = 8;
const UID_MUNITIONKIND_DOMAIN = 14;
const UID_SUPPLYKIND_DOMAIN = 600;
const UID_COUNTRY = 29;

// Bitmaps for entity type fields
export const BITMAP_0 = 0n;
export const BITMAP_KIND = 0xff00000000000000n;
export const BITMAP_KIND_DOMAIN = 0xffff000000000000n;
export const BITMAP_KIND_DOMAIN_COUNTRY = 0xffffffff00000000n;
export const BITMAP_COUNTRY = 0x0000ffff00000000n;
export const BITMAP_COUNTRY_CAT = 0xffffffffff000000n;
export const BITMAP_COUNTRY_CAT_SUBCAT = 0xffffffffffff0000n;
export const BITMAP_COUNTRY_CAT_SUBCAT_SPECIFIC = 0xffffffffffffff00n;
export const BITMAP_0_CAT = 0xffff0000ff000000n;
export const BITMAP_0_CAT_SUBCAT = 0xffff0000ffff0000n;
export const BITMAP_0_CAT_SUBCAT_SPECIFIC = 0xffff0000ffffff00n;
export const BITMAP_0_CAT_SUBCAT_SPECIFIC_EXTRA = 0xffff0000ffffffffn;

// Default settings for the configuration options.
export const DEFAULT_QUALIFIED = true;
export const DEFAULT_DELIMITER = " / ";
export const DEFAULT_DEPRECATED = false;

export class SisoEnums {
  private parsedXml: SISOXMLTypes;
  private mapKind: Map<bigint, string> = new Map();
  private mapDomain: Map<bigint, string> = new Map();
  private mapCountry: Map<bigint, string> = new Map();
  private mapCategory: Map<bigint, string> = new Map();
  private applicabilityMap: Map<string, number[]> = new Map();

  constructor(parsedXml: SISOXMLTypes) {
    this.parsedXml = parsedXml;
    this.initialize();
  }

  private get countryCount() {
    return this.mapCountry.size;
  }

  private get kindCount() {
    return this.mapKind.size;
  }

  private get domainCount() {
    return this.mapDomain.size;
  }

  private get categoryCount() {
    return this.mapCategory.size;
  }

  private initialize() {
    this.initializeEnums();
    this.initializeEntityTypes();
    debug(`Processed ${this.countryCount} countries`);
    debug(`Processed ${this.kindCount} kinds`);
    debug(`Processed ${this.domainCount} domains`);
    debug(`Processed ${this.categoryCount} categories`);
  }

  private initializeEnums() {
    for (const e of this.parsedXml.ebv.enum) {
      switch (+e.__uid) {
        case UID_COUNTRY:
          this.initializeCountries(e);
          break;
        case UID_ENTITYKIND:
          this.initializeEntityKinds(e);
          break;
        case UID_MUNITIONKIND_DOMAIN:
        case UID_OTHERKIND_DOMAIN:
        case UID_SUPPLYKIND_DOMAIN:
          this.initializeDomains(e);
          break;
        default:
          continue;
      }
    }
  }

  private initializeEntityTypes() {
    debug("Parsing entities");
    for (const c of this.parsedXml.ebv.cet) {
      if (Array.isArray(c.entity)) {
        for (const e of c.entity) {
          this.initializeEntity(e);
        }
      } else if (c.entity != null) {
        this.initializeEntity(c.entity);
      } else {
        console.warn(`Unsupported entity type for ${JSON.stringify(c)}`);
      }
    }
  }

  private initializeEntity(ee: EntityElement | PurpleEntity) {
    if (Array.isArray(ee.category)) {
      for (const c of ee.category) {
        this.initializeCategory(+ee.__kind, +ee.__domain, +ee.__country, c);
      }
    } else {
      this.initializeCategory(+ee.__kind, +ee.__domain, +ee.__country, ee.category);
    }
  }

  private initializeCategory(kind: number, domain: number, country: number, c: CategoryElement | JammerKind) {
    this.output(this.mapCategory, kind, domain, country, +c.__value, 0, 0, 0, c.__description);
    if (c.subcategory) {
      this.initializeSubcategory(kind, domain, country, +c.__value, c.subcategory, c.__description);
    }
  }

  private initializeSubcategory(
    kind: number,
    domain: number,
    country: number,
    category: number,
    scc: SubcategoryClass[] | CategoryElement | SubcategoryElement[] | PurpleSubcategory,
    text: string,
  ) {
    if (Array.isArray(scc)) {
      for (const sc of scc) {
        this.processSubcategory(kind, domain, country, category, sc, text);
      }
    } else if (scc.__value != null && scc.__description != null) {
      this.processSubcategory(kind, domain, country, category, scc, text);
    } else {
      console.warn(`Unsupported format for Subcategory (${JSON.stringify(scc)})`);
    }
  }

  private processSubcategory(
    kind: number,
    domain: number,
    country: number,
    category: number,
    scc: SubcategoryClass | CategoryElement | PurpleSubcategory,
    text: string,
  ) {
    const description = `${text}${DEFAULT_DELIMITER}${scc.__description}`;
    this.output(this.mapCategory, kind, domain, country, category, +scc.__value, 0, 0, description);
    if (scc.specific) {
      this.initializeSpecific(kind, domain, country, category, +scc.__value, scc.specific, description);
    }
  }

  public initializeSpecific(
    kind: number,
    domain: number,
    country: number,
    category: number,
    subcategory: number,
    spec: SubcategoryClass | SubcategoryClass[] | AllSpecificTypes | AllSpecificTypes[],
    text: string,
  ) {
    if (Array.isArray(spec)) {
      for (const sp of spec) {
        this.processSpecific(kind, domain, country, category, subcategory, sp, text);
      }
    } else if (spec.__value != null && spec.__description != null) {
      this.processSpecific(kind, domain, country, category, subcategory, spec, text);
    } else {
      return debug(`SKIPPED: unsupported value for Specific (${JSON.stringify(spec)})`);
    }
  }

  private processSpecific(
    kind: number,
    domain: number,
    country: number,
    category: number,
    subcategory: number,
    spec: SubcategoryClass | CategoryElement,
    text: string,
  ) {
    const description = `${text}${DEFAULT_DELIMITER}${spec.__description}`;
    this.output(this.mapCategory, kind, domain, country, category, subcategory, +spec.__value, 0, description);
    if (spec.extra) {
      this.initializeExtra(kind, domain, country, category, subcategory, +spec.__value, spec.extra, description);
    }
  }

  public initializeExtra(
    kind: number,
    domain: number,
    country: number,
    category: number,
    subcategory: number,
    specific: number,
    extra: SubcategoryClass | SubcategoryClass[] | AllSpecificTypes | AllSpecificTypes[] | JammerKind | JammerKind[],
    text: string,
  ) {
    if (Array.isArray(extra)) {
      for (const ex of extra) {
        this.processExtra(kind, domain, country, category, subcategory, specific, ex, text);
      }
    } else if (extra.__value != null && extra.__description != null) {
      this.processExtra(kind, domain, country, category, subcategory, specific, extra, text);
    } else {
      return debug(`SKIPPED: unsupported value for extra (${JSON.stringify(extra)})`);
    }
  }

  private processExtra(
    kind: number,
    domain: number,
    country: number,
    category: number,
    subcategory: number,
    specific: number,
    extra: SubcategoryClass | CategoryElement | AllSpecificTypes | JammerKind,
    text: string,
  ) {
    const description = `${text}${DEFAULT_DELIMITER}${extra.__description}`;
    this.output(this.mapCategory, kind, domain, country, category, subcategory, specific, +extra.__value, description);
  }

  private initializeCountries(e: Enum) {
    debug("Parsing countries");
    if (!e.enumrow || !Array.isArray(e.enumrow)) return;
    for (const r of e.enumrow) {
      this.output(this.mapCountry, 0, 0, +r.__value, 0, 0, 0, 0, r.__description);
    }
    debug(JSON.stringify(Object.fromEntries(this.mapCountry)));
  }

  private initializeEntityKinds(e: Enum) {
    debug("Parsing kinds");
    if (!e.enumrow || !Array.isArray(e.enumrow)) return;
    for (const r of e.enumrow) {
      this.output(this.mapKind, +r.__value, 0, 0, 0, 0, 0, 0, r.__description);
    }
    debug(JSON.stringify(Object.fromEntries(this.mapKind)));
  }

  private initializeDomains(e: Enum) {
    debug("Parsing domains");
    if (!e.enumrow || !Array.isArray(e.enumrow)) return;
    for (const r of e.enumrow) {
      for (const kind of this.getKinds(e.__applicability)) {
        this.output(this.mapDomain, kind, +r.__value, 0, 0, 0, 0, 0, r.__description);
      }
    }
    debug(JSON.stringify(Object.fromEntries(this.mapDomain)));
  }

  private getKinds(applicability?: string): number[] {
    if (!applicability) {
      return [];
    }

    let kinds = this.applicabilityMap.get(applicability);
    if (!kinds) {
      kinds = [];
      const parts = applicability.split(",");
      for (const part of parts) {
        const range = part.split("-").map((r) => +r || 0);
        if (range.length === 1) {
          kinds.push(range[0]!);
        } else if (range.length > 1) {
          const min = range[0]!;
          const max = range[1]!;
          for (let kind = min; kind < max; kind++) {
            kinds.push(kind);
          }
          kinds.push(max);
        }
      }
      this.applicabilityMap.set(applicability, kinds);
    }

    return kinds;
  }

  // public searchEntityKind(query: string): EntityKind[] {
  //   return Object.entries(EntityKindDescriptions)
  //     .filter(([_, desc]) => desc.toLowerCase().includes(query.toLowerCase()))
  //     .map(([key]) => key as EntityKind);
  // }

  public getOrDefault(entityType: bigint, defaultValue: string | null): string | null {
    let text =
      this.mapCategory.get(entityType) ??
      this.mapCategory.get(entityType & BITMAP_0_CAT_SUBCAT_SPECIFIC_EXTRA) ??
      this.mapCategory.get(entityType & BITMAP_COUNTRY_CAT_SUBCAT_SPECIFIC) ??
      this.mapCategory.get(entityType & BITMAP_0_CAT_SUBCAT_SPECIFIC) ??
      this.mapCategory.get(entityType & BITMAP_COUNTRY_CAT_SUBCAT) ??
      this.mapCategory.get(entityType & BITMAP_0_CAT_SUBCAT) ??
      this.mapCategory.get(entityType & BITMAP_COUNTRY_CAT) ??
      this.mapCategory.get(entityType & BITMAP_KIND_DOMAIN_COUNTRY) ??
      this.mapCategory.get(entityType & BITMAP_0_CAT) ??
      this.mapCategory.get(entityType & BITMAP_KIND_DOMAIN) ??
      defaultValue;

    if (text == null) {
      return null;
    }

    this.mapCategory.set(entityType, text);
    return text;
  }

  public getDomainOrDefault(entityType: bigint, defaultValue?: string): string | null {
    let text =
      this.mapDomain.get(entityType & BITMAP_KIND_DOMAIN) ??
      this.mapDomain.get(entityType & BITMAP_KIND) ??
      this.mapDomain.get(BITMAP_0) ??
      defaultValue;
    if (text == null) {
      return null;
    }
    this.mapDomain.set(entityType, text);
    return text;
  }

  public getAllCountries(): Map<number, string> {
    const result = new Map<number, string>();
    this.mapCountry.forEach((value, key) => {
      result.set(toNumber(key >> 32n), value);
    });
    return result;
  }

  public getAllDomains(): Map<number, string> {
    const result = new Map<number, string>();
    this.mapDomain.forEach((value, key) => {
      result.set(toNumber(key >> 48n), value);
    });
    return result;
  }

  public getAllKinds(): Map<number, string> {
    const result = new Map<number, string>();
    this.mapKind.forEach((value, key) => {
      result.set(toNumber(key >> 56n), value);
    });
    return result;
  }

  public getAllDomainsOf(kind: number): Map<number, string> {
    return new Map(
      [...this.mapDomain.entries()].filter(([k]) => Number((k >> 56n) & 0xffn) === kind).map(([k, v]) => [Number((k >> 48n) & 0xffn), v]),
    );
  }

  public getCountry(country: number): string {
    return this.getAllCountries().get(country) || `Invalid country ${country}`;
  }

  public getAllCategoriesOf(kind: number, domain: number, country: number): Map<number, string> {
    return new Map(
      [...this.mapCategory.entries()]
        .filter(([k]) => Number((k >> 56n) & 0xffn) === kind)
        .filter(([k]) => Number((k >> 48n) & 0xffn) === domain)
        .filter(([k]) => {
          const c = Number((k >> 32n) & 0xffffn);
          return c === country || c === 0;
        })
        .filter(([k]) => Number((k >> 16n) & 0xffn) === 0)
        .filter(([k]) => Number((k >> 8n) & 0xffn) === 0)
        .filter(([k]) => Number(k & 0xffn) === 0)
        .map(([k, v]) => [Number((k >> 24n) & 0xffn), v]),
    );
  }

  public getAllSubcategoriesOf(kind: number, domain: number, country: number, category: number): Map<number, string> {
    return new Map(
      [...this.mapCategory.entries()]
        .filter(([k]) => Number((k >> 56n) & 0xffn) === kind)
        .filter(([k]) => Number((k >> 48n) & 0xffn) === domain)
        .filter(([k]) => {
          const c = Number((k >> 32n) & 0xffffn);
          return c === country || c === 0;
        })
        .filter(([k]) => Number((k >> 24n) & 0xffn) === category)
        .filter(([k]) => Number((k >> 8n) & 0xffn) === 0)
        .filter(([k]) => Number(k & 0xffn) === 0)
        .map(([k, v]) => [Number((k >> 16n) & 0xffn), v]),
    );
  }

  public getAllSpecificsOf(kind: number, domain: number, country: number, category: number, subcategory: number): Map<number, string> {
    return new Map(
      [...this.mapCategory.entries()]
        .filter(([k]) => Number((k >> 56n) & 0xffn) === kind)
        .filter(([k]) => Number((k >> 48n) & 0xffn) === domain)
        .filter(([k]) => {
          const c = Number((k >> 32n) & 0xffffn);
          return c === country || c === 0;
        })
        .filter(([k]) => Number((k >> 24n) & 0xffn) === category)
        .filter(([k]) => Number((k >> 16n) & 0xffn) === subcategory)
        .filter(([k]) => Number(k & 0xffn) === 0)
        .map(([k, v]) => [Number((k >> 8n) & 0xffn), v]),
    );
  }

  public getAllExtrasOf(kind: number, domain: number, country: number, cat: number, subcat: number, specific: number): Map<number, string> {
    return new Map(
      [...this.mapCategory.entries()]
        .filter(([k]) => Number((k >> 56n) & 0xffn) === kind)
        .filter(([k]) => Number((k >> 48n) & 0xffn) === domain)
        .filter(([k]) => {
          const c = Number((k >> 32n) & 0xffffn);
          return c === country || c === 0;
        })
        .filter(([k]) => Number((k >> 24n) & 0xffn) === cat)
        .filter(([k]) => Number((k >> 16n) & 0xffn) === subcat)
        .filter(([k]) => Number((k >> 8n) & 0xffn) === specific)
        .map(([k, v]) => [Number(k & 0xffn), v]),
    );
  }

  public searchDescription(query: string): Map<string, string> {
    return new Map(
      [...this.mapCategory.entries()].filter(([, v]) => v.toLowerCase().includes(query.toLowerCase())).map(([k, v]) => [k.toString(), v]),
    );
  }

  private output(
    map: Map<bigint, string>,
    kind: number,
    domain: number,
    country: number,
    cat: number,
    subcat: number,
    spec: number,
    extra: number,
    txt: string,
  ) {
    const key = this.createKey(kind, domain, country, cat, subcat, spec, extra);
    map.set(key, txt);
  }

  public createKey(kind: number, domain: number, country: number, cat: number, subcat: number, specific: number, extra: number): bigint {
    const key =
      ((toBigInt(kind) & 0xffn) << 56n) |
      ((toBigInt(domain) & 0xffn) << 48n) |
      ((toBigInt(country) & 0xffffn) << 32n) |
      ((toBigInt(cat) & 0xffn) << 24n) |
      ((toBigInt(subcat) & 0xffn) << 16n) |
      ((toBigInt(specific) & 0xffn) << 8n) |
      (toBigInt(extra) & 0xffn);
    return key;
  }

  toString() {
    if (!this.parsedXml) return "";
    const builder = new XMLBuilder();
    return builder.build(this.parsedXml);
  }
}

import { describe, it, expect, beforeAll } from "vitest";
import { SisoEnumParser } from "../lib/enumparser.js";
import { loadSisoEnums } from "./testutils.js";
import { SisoEnums } from "../lib/sisoenums.js";
import { toNumber } from "../lib/utils.js";

describe("SisoEnumParser class", () => {
  it("is defined", () => {
    expect(SisoEnumParser).toBeDefined();
  });

  describe("loading SISO enums from XML", () => {
    let scenario: ReturnType<typeof loadSisoEnums>;
    beforeAll(() => {
      scenario = loadSisoEnums();
    });

    it("is successful", () => {
      expect(scenario).toBeDefined();
    });

    describe("bitshifting", () => {
      it("has correct bigint key for zero", () => {
        let key = scenario.createKey(0, 0, 0, 0, 0, 0, 0);
        expect(key).toBe(BigInt(0));
      });
      it("has correct bigint key for 1.1", () => {
        let key = scenario.createKey(1, 1, 0, 0, 0, 0, 0);
        expect(key).toBe(BigInt(0x0101000000000000));
      });
      it("has correct bigint key for country", () => {
        let key = scenario.createKey(0, 0, 1, 0, 0, 0, 0);
        expect(key).toBe(BigInt(4294967296));
      });
      it("has correct bigint key for platform", () => {
        let key = scenario.createKey(1, 2, 3, 0, 0, 0, 0);
        expect(Number(BigInt(key) >> 56n)).toBe(1);
      });
      it("has correct bigint key for domain", () => {
        let key = scenario.createKey(0, 2, 0, 0, 0, 0, 0);
        expect(Number(BigInt(key) >> 48n)).toBe(2);
      });
    });

    describe("has correct countries", () => {
      it("amount of 279", () => {
        expect(scenario.getAllCountries().size).toBe(279);
      });
      it("returns correct country Afghanistan", () => {
        let country = scenario.getCountry(1);
        expect(country).toBe("Afghanistan (AFG)");
      });
      it("returns correct country Netherlands", () => {
        let country = scenario.getCountry(153);
        expect(country).toBe("Netherlands (NLD)");
      });
    });

    describe("has correct kinds", () => {
      it("amount of 10", () => {
        expect(scenario.getAllKinds().size).toBe(10);
      });
      it("returns correct kind Platform", () => {
        let kind = scenario.getAllKinds().get(1);
        expect(kind).toBe("Platform");
      });
      it("returns correct kind Other", () => {
        let kind = scenario.getAllKinds().get(0);
        expect(kind).toBe("Other");
      });
    });

    describe("has correct domains", () => {
      it("amount of 68", () => {
        expect(scenario.getAllDomains().size).toBe(68);
      });
      it("returns correct domain Land for 1.1.*", () => {
        let key = scenario.createKey(1, 1, 0, 0, 0, 0, 0);
        let domain = scenario.getDomainOrDefault(key);
        expect(domain).toBe("Land");
      });
      it("returns correct domain Air for 4.2.*", () => {
        let key = scenario.createKey(4, 2, 0, 0, 0, 0, 0);
        let domain = scenario.getDomainOrDefault(key);
        expect(domain).toBe("Air");
      });
      it("returns default domain Anders for 99.99.*", () => {
        let key = scenario.createKey(99, 99, 0, 0, 0, 0, 0);
        let domain = scenario.getDomainOrDefault(key, "Anders");
        expect(domain).toBe("Anders");
      });
      it("domains for Platform", () => {
        expect(scenario.getAllDomainsOf(1).size).toBe(6);
        expect(scenario.getAllDomainsOf(1).values()).toContain("Land");
        expect(scenario.getAllDomainsOf(1).values()).toContain("Air");
        expect(scenario.getAllDomainsOf(1).values()).toContain("Surface");
        expect(scenario.getAllDomainsOf(1).values()).toContain("Subsurface");
        expect(scenario.getAllDomainsOf(1).values()).toContain("Space");
        expect(scenario.getAllDomainsOf(1).values()).toContain("Other");
      });
    });

    describe("has correct categories", () => {
      it("subsurface platforms for Netherlands", () => {
        expect(scenario.getAllCategoriesOf(1, 4, 153).size).toBe(2);
        expect(scenario.getAllCategoriesOf(1, 4, 153).values()).toContain("Semi-Submersible Boats");
        expect(scenario.getAllCategoriesOf(1, 4, 153).values()).toContain("SS (Conventional Attack-Torpedo, Patrol)");
      });
      it("surface environmental for Other", () => {
        expect(scenario.getAllCategoriesOf(4, 3, 0).size).toBe(10);
        expect(scenario.getAllCategoriesOf(4, 3, 0).values()).toContain("Island");
        expect(scenario.getAllCategoriesOf(4, 3, 0).values()).toContain("Sea State");
      });
    });

    describe("has correct subcategories", () => {
      it("SS subcategories for Netherlands", () => {
        let subcats = Array.from(scenario.getAllSubcategoriesOf(1, 4, 153, 5).values());
        expect(subcats.length).toBe(3);
        expect(subcats.some((v) => v.includes("Hai Lung Class"))).toBeTruthy();
        expect(subcats.some((v) => v.includes("Walrus Class"))).toBeTruthy();
      });
      it("types of Aircraft Wreckage", () => {
        let subcats = Array.from(scenario.getAllSubcategoriesOf(5, 1, 0, 31).values());
        expect(subcats.length).toBe(3);
        expect(subcats.some((v) => v.includes("Fixed Wing"))).toBeTruthy();
        expect(subcats.some((v) => v.includes("Rotary Wing"))).toBeTruthy();
      });
    });

    describe("has correct specifics", () => {
      it("Agusta Westland AW129 Mangusta of Italia", () => {
        let specifics = Array.from(scenario.getAllSpecificsOf(1, 2, 106, 20, 2).values());
        expect(specifics.length).toBe(4);
        expect(specifics.some((v) => v.includes("AH-129A Mangusta"))).toBeTruthy();
        expect(specifics.some((v) => v.includes("AH-129C Mangusta"))).toBeTruthy();
        expect(specifics.some((v) => v.includes("AH-129D Mangusta"))).toBeTruthy();
      });
    });

    describe("has correct extras", () => {
      it("MC-12W Liberty of USA", () => {
        let extras = Array.from(scenario.getAllExtrasOf(1, 2, 225, 7, 8, 7).values());
        expect(extras.length).toBe(5);
        expect(extras.some((v) => v.includes("MC-12S EMARSS-S"))).toBeTruthy();
        expect(extras.some((v) => v.includes("MC-12S-1 EMARSS-G"))).toBeTruthy();
        expect(extras.some((v) => v.includes("MC-12S-2 EMARSS-M"))).toBeTruthy();
        expect(extras.some((v) => v.includes("MC-12S-3 EMARSS-V"))).toBeTruthy();
      });
    });

    describe("is searchable", () => {
      it("finds MC-12S-1 EMARSS-G of USA", () => {
        let results = Array.from(scenario.searchDescription("MC-12S-1 EMARSS-G").values());
        expect(results.length).toBe(1);
        expect(results.some((v) => v.includes("MC-12S-1 EMARSS-G"))).toBeTruthy();
      });
      it("finds F803 Tromp", () => {
        let results = Array.from(scenario.searchDescription("F803 Tromp").values());
        expect(results.length).toBe(1);
        expect(results.some((v) => v.includes("F803 Tromp"))).toBeTruthy();
      });
    });
  });
});

describe("SisoEnums class", () => {
  it("is defined", () => {
    expect(SisoEnums).toBeDefined();
  });
});

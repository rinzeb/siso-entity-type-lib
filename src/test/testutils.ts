import { SisoEnumsFactory } from "../lib/sisoenumsfactory.js";
import type { SisoEnums } from "../lib/sisoenums.js";

export function loadSisoEnums(fileName = "/../../data/SISO-REF-010.xml"): SisoEnums {
  let enums = SisoEnumsFactory.createFromFile(fileName);
  return enums;
}

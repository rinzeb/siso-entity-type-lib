import fs from "fs";
import { SisoEnumParser } from "../lib/enumparser.js";
import type { SisoEnums } from "../lib/sisoenums.js";

export function loadSisoEnums(fileName = "/../data/SISO-REF-010.xml"): SisoEnums {
  let data = fs.readFileSync(__dirname + fileName, { encoding: "utf-8" });
  let enums = SisoEnumParser.createFromString(data.toString());
  return enums;
}

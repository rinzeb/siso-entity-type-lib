import { XMLParser } from "fast-xml-parser";
import { SisoEnums } from "./sisoenums.js";
import { Convert } from "../generated/siso-xml-types.js";

export class SisoEnumParser {
  static createFromString(xmlString: string): SisoEnums {
    let parser = new XMLParser({
      ignoreAttributes: ["uuid", "baseuuid"],
      attributeNamePrefix: "__",
      allowBooleanAttributes: true,
    });
    let jsonObj = parser.parse(xmlString);
    const sisoXmlTypes = Convert.toSISOXMLTypes(JSON.stringify(jsonObj));
    const sisoEnums = new SisoEnums(sisoXmlTypes);
    if (!sisoEnums) {
      throw new TypeError("Invalid SISO enums file");
    }
    return sisoEnums;
  }
}

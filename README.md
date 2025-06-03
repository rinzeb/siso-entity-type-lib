# SISO-REF-010 entity type enumerations library

**Experimental**

A JavaScript library for parsing SISO-REF-010 entity type enumerations data.

The SISO-REF-010 is a standard developed by the [Simulation Interoperability Standards
Organization (SISO)](https://www.sisostds.org/Home.aspx) and is widely used in distributed simulations such as HLA and DIS to provide Simulation Interoperability.

## Copyright notice

The [SISO-REF-010-2024](https://www.sisostandards.org/page/ReferenceDocuments) has a copyright © 2024 by the Simulation Interoperability Standards Organization, Inc.

## Usage

To use SISO-REF-010 enums library in your project, follow these steps:

1. Install the library using pnpm:

   ```sh
   pnpm install siso-entity-type-lib
   ```

2. Import and use the library in your TypeScript or JavaScript code:

   ```typescript
   // Example usage in NodeJS
   import { SisoEnum, EntityKind } from "siso-entity-type-lib";
   let filePath = "/../data/SISO-REF-010.xml";
   let sisoEnums = SisoEnumsFactory.createFromFile(filePath);
   let country = sisoEnums.getCountry(153); // country = "The Netherlands (NLD)"
   let searchResults = sisoEnums.searchDescription("F803"); // searchResults = {"1.3.153.6.4.2.0":"Guided Missile Frigate (FFG) / De Zeven Provincien Class / F803 Tromp"}
   let categories = sisoEnums.getAllCategoriesOf(1, 4, 153).values(); // categories = ["Semi-Submersible Boats", "SS (Conventional Attack-Torpedo, Patrol)"]
   let domains = sisoEnums.getAllDomainsOf(EntityKind.Platform).values(); // domains = ["Other", "Land", "Air", ...]
   ```

   ```typescript
   // Example usage in browser (using vite)
   import { SisoEnums, SisoEnumsFactory } from "siso-entity-type-lib";
   import sisoEnumFilePath from "siso-entity-type-lib/data/SISO-REF-010.xml?url";
   const res = await fetch(sisoEnumFilePath);
   const sisoEnumXml = await res.text();
   this.sisoEnums = SisoEnumsFactory.createFromString(sisoEnumXml);
   let country = sisoEnums.getCountry(153); // country = "The Netherlands (NLD)"
   ```

## Development

SISO-entity-type-lib is developed in TypeScript. To contribute or modify the library, follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/rinzeb/siso-entity-type-lib.git
   cd siso-entity-type-lib
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Build the project:

   ```sh
   pnpm run build
   ```

4. Run tests:
   ```sh
   pnpm run test
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

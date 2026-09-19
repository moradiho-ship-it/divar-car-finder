import catalog from './divarCarCatalog.json';

type VehicleNode = {
  key: string;
  title: string;
  children?: VehicleNode[];
};

const brands: VehicleNode[] = catalog.brands;
const unique = (values: string[]) => [...new Set(values)];

// Divar stores full names at each level. Form values keep only the part after
// the parent name so searches do not repeat the brand and model terms.
function relativeTitle(parent: string, child: string) {
  return child.startsWith(`${parent} `) ? child.slice(parent.length + 1) : child;
}

function descendants(node: VehicleNode): VehicleNode[] {
  return (node.children ?? []).flatMap((child) => [child, ...descendants(child)]);
}

export const BRAND_OPTIONS = brands.map((brand) => brand.title);
export const MODELS_BY_BRAND: Record<string, string[]> = Object.fromEntries(
  brands.map((brand) => [
    brand.title,
    unique((brand.children ?? []).map((model) => relativeTitle(brand.title, model.title))),
  ]),
);

// Use brand AND model for lookup: names such as «پلاس» occur under many brands.
export const TRIMS_BY_BRAND_AND_MODEL: Record<string, Record<string, string[]>> = Object.fromEntries(
  brands.map((brand) => {
    const models: Record<string, string[]> = {};
    for (const model of brand.children ?? []) {
      const modelName = relativeTitle(brand.title, model.title);
      models[modelName] = unique([
        ...(models[modelName] ?? []),
        ...descendants(model).map((trim) => relativeTitle(model.title, trim.title)),
      ]);
    }
    return [brand.title, models];
  }),
);

export const COLORS = catalog.colors.map((color) => color.display);
export const BODY_CONDITIONS = catalog.body_statuses.map((status) => status.display);
export const TRANSMISSIONS = catalog.filters.find((field) => field.key === 'gearbox')?.options.map((option) => option.title) ?? [];
export const CITIES = unique(catalog.cities.map((city) => city.display));
export const TEHRAN_DISTRICTS = catalog.tehran_districts.map((district) => district.display);
export const YEARS = Array.from({ length: 46 }, (_, i) => String(1405 - i));
export const PRICE_SUGGESTIONS = [300_000_000, 500_000_000, 750_000_000, 1_000_000_000, 1_500_000_000, 2_000_000_000, 3_000_000_000, 5_000_000_000, 10_000_000_000];
export const MILEAGE_SUGGESTIONS = [0, 10_000, 25_000, 50_000, 80_000, 100_000, 150_000, 200_000, 300_000];

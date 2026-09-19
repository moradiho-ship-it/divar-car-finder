import { expect, it } from 'vitest';
import {
  BODY_CONDITIONS,
  BRAND_OPTIONS,
  CITIES,
  COLORS,
  MODELS_BY_BRAND,
  TEHRAN_DISTRICTS,
  TRIMS_BY_BRAND_AND_MODEL,
} from './vehicleOptions';

it('exposes the complete imported car hierarchy and public filter options', () => {
  expect(BRAND_OPTIONS).toHaveLength(161);
  expect(MODELS_BY_BRAND['پژو']).toContain('206');
  expect(TRIMS_BY_BRAND_AND_MODEL['پژو']['206']).toContain('SD V8');
  expect(TRIMS_BY_BRAND_AND_MODEL['آئودی']['TT']).toContain('کروک');
  expect(COLORS).toHaveLength(38);
  expect(BODY_CONDITIONS).toHaveLength(8);
  expect(CITIES.length).toBeGreaterThan(1100);
  expect(TEHRAN_DISTRICTS).toHaveLength(421);
});

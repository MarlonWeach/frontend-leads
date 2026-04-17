import { deriveVolumeContracted } from '../../../src/types/goals';

describe('PBI 33 / Task 33-8: deriveVolumeContracted', () => {
  it('arredonda budget / CPL quando captado é zero', () => {
    expect(deriveVolumeContracted(10_000, 50, 0)).toBe(200);
  });

  it('usa max(derivado, floor(captado)) quando captado supera o derivado', () => {
    expect(deriveVolumeContracted(10_000, 50, 250)).toBe(250);
  });

  it('arredonda 10001 / 50 para 200', () => {
    expect(deriveVolumeContracted(10_001, 50, 0)).toBe(200);
  });

  it('floor no captado fracionário antes do max', () => {
    expect(deriveVolumeContracted(10_000, 50, 199.9)).toBe(200);
    expect(deriveVolumeContracted(10_000, 50, 201.2)).toBe(201);
  });

  it('retorna 0 para budget ou CPL não finitos ou <= 0', () => {
    expect(deriveVolumeContracted(NaN, 50, 0)).toBe(0);
    expect(deriveVolumeContracted(1000, NaN, 0)).toBe(0);
    expect(deriveVolumeContracted(0, 50, 0)).toBe(0);
    expect(deriveVolumeContracted(1000, 0, 0)).toBe(0);
    expect(deriveVolumeContracted(-100, 50, 0)).toBe(0);
  });

  it('trata captado não finito como 0', () => {
    expect(deriveVolumeContracted(5000, 25, NaN)).toBe(200);
  });
});

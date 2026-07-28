import { pentagonPoints, toPointsAttr, surroundingCenters } from "../geometry";

const dist = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);

describe("pentagonPoints", () => {
  it("întoarce cinci vârfuri", () => {
    expect(pentagonPoints(50, 50, 10)).toHaveLength(5);
  });

  it("le așază pe toate la raza cerută", () => {
    pentagonPoints(50, 50, 12).forEach((p) => {
      expect(dist([50, 50], p)).toBeCloseTo(12, 6);
    });
  });

  it("pune un vârf exact deasupra centrului la rotația implicită", () => {
    const [first] = pentagonPoints(50, 50, 10);
    expect(first[0]).toBeCloseTo(50, 6);
    expect(first[1]).toBeCloseTo(40, 6);
  });

  it("laturile sunt egale — pentagonul e regulat", () => {
    const pts = pentagonPoints(0, 0, 20, 17);
    const sides = pts.map((p, i) => dist(p, pts[(i + 1) % 5]));
    sides.forEach((s) => expect(s).toBeCloseTo(sides[0], 6));
  });

  it("rotația deplasează vârfurile, dar păstrează raza", () => {
    const a = pentagonPoints(0, 0, 10, -90);
    const b = pentagonPoints(0, 0, 10, -90 + 36);
    expect(b[0][0]).not.toBeCloseTo(a[0][0], 3);
    b.forEach((p) => expect(dist([0, 0], p)).toBeCloseTo(10, 6));
  });
});

describe("surroundingCenters", () => {
  it("dă cinci centre, toate la aceeași distanță de mijloc", () => {
    const centers = surroundingCenters(50, 50, 41);
    expect(centers).toHaveLength(5);
    centers.forEach((c) => expect(dist([50, 50], c)).toBeCloseTo(41, 6));
  });
});

describe("toPointsAttr", () => {
  it("formatează perechile pentru atributul SVG points", () => {
    expect(toPointsAttr([[1, 2], [3.14159, 4]])).toBe("1.00,2.00 3.14,4.00");
  });
});

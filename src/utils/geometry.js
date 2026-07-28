// Geometrie pură pentru desenele vectoriale. Stă separat de componente ca să
// poată fi verificată fără să încarce react-native-svg.

// Vârfurile unui pentagon regulat. `rotationDeg` la -90 pune un vârf în sus.
export function pentagonPoints(cx, cy, r, rotationDeg = -90) {
  const points = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = ((rotationDeg + i * 72) * Math.PI) / 180;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return points;
}

// Formatul cerut de atributul `points` al unui <Polygon>.
export function toPointsAttr(points) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

// Centrele celor cinci pentagoane din jurul celui central.
export function surroundingCenters(cx, cy, distance, rotationDeg = -90) {
  return pentagonPoints(cx, cy, distance, rotationDeg);
}

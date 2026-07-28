import React from "react";
import Svg, { Circle, ClipPath, Defs, G, Polygon, RadialGradient, Stop } from "react-native-svg";
import { pentagonPoints, toPointsAttr, surroundingCenters } from "../../utils/geometry";

const R = 46;          // raza mingii în sistemul viewBox
const CENTER = 50;
const INNER_R = 14;    // raza pentagonului central
const OUTER_R = 15;    // raza pentagoanelor din jur
const OUTER_D = 41;    // distanța lor față de centru

// Minge de fotbal stilizată. E desenată vectorial, nu decupată din logo:
// personajul acoperă mingea în ilustrație, deci n-ar fi putut fi separată.
export function SoccerBall({ size = 120 }) {
  const outer = surroundingCenters(CENTER, CENTER, OUTER_D, -90);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="ballSkin" cx="38%" cy="30%" r="72%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#E6EBF0" />
          <Stop offset="1" stopColor="#9AA6B2" />
        </RadialGradient>
        <ClipPath id="ballClip">
          <Circle cx={CENTER} cy={CENTER} r={R} />
        </ClipPath>
      </Defs>

      <Circle cx={CENTER} cy={CENTER} r={R} fill="url(#ballSkin)" />

      <G clipPath="url(#ballClip)">
        <Polygon points={toPointsAttr(pentagonPoints(CENTER, CENTER, INNER_R, -90))} fill="#111318" />
        {outer.map(([x, y], i) => (
          <Polygon
            key={i}
            points={toPointsAttr(pentagonPoints(x, y, OUTER_R, -90 + 36 + i * 72))}
            fill="#111318"
          />
        ))}
      </G>

      {/* Contur subțire în accentul mărcii, ca mingea să nu pară un decupaj */}
      <Circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="#06B6D4" strokeOpacity="0.5" strokeWidth="1.5" />
    </Svg>
  );
}

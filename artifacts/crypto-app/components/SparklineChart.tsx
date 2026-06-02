import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface Props {
  data: number[];
  width: number;
  height: number;
  positive: boolean;
  showGradient?: boolean;
}

export default function SparklineChart({
  data,
  width,
  height,
  positive,
  showGradient = false,
}: Props) {
  const { linePath, fillPath } = useMemo(() => {
    if (!data || data.length < 2) return { linePath: "", fillPath: "" };

    const filtered = data.filter((v) => typeof v === "number" && isFinite(v));
    if (filtered.length < 2) return { linePath: "", fillPath: "" };

    const min = Math.min(...filtered);
    const max = Math.max(...filtered);
    const range = max - min || 1;

    const pad = 2;
    const w = width;
    const h = height - pad * 2;

    const points = filtered.map((v, i) => ({
      x: (i / (filtered.length - 1)) * w,
      y: pad + h - ((v - min) / range) * h,
    }));

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      line += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }

    const fill =
      line +
      ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { linePath: line, fillPath: fill };
  }, [data, width, height]);

  const color = positive ? "#00C2A8" : "#FF5F6D";
  const gradientId = `grad-${positive ? "pos" : "neg"}`;

  if (!linePath) return <View style={{ width, height }} />;

  return (
    <Svg width={width} height={height}>
      {showGradient && (
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
      )}
      {showGradient && (
        <Path d={fillPath} fill={`url(#${gradientId})`} />
      )}
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={showGradient ? 2 : 1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

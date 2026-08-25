"use client";

import { useEffect, useMemo, useState } from "react";
import { statsFromCanvas, type ColorMatch, type ColorStats } from "@/lib/grade";
import { drawExact, fileToBitmap } from "@/lib/image";

function statsFromBitmap(bitmap: ImageBitmap): ColorStats {
  const canvas = drawExact(bitmap, bitmap.width, bitmap.height);
  return statsFromCanvas(canvas);
}

export function useLookMatch(bitmap: ImageBitmap | null) {
  const [source, setSource] = useState<ColorStats | null>(null);
  const [reference, setReference] = useState<ColorStats | null>(null);
  const [amount, setAmount] = useState(80);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!bitmap) {
      setSource(null);
      return;
    }
    setSource(statsFromBitmap(bitmap));
  }, [bitmap]);

  async function loadReference(file: File | null) {
    if (!file) {
      setReference(null);
      setName(null);
      return;
    }
    const bmp = await fileToBitmap(file);
    const stats = statsFromBitmap(bmp);
    bmp.close();
    setReference(stats);
    setName(file.name);
  }

  const match: ColorMatch | null = useMemo(
    () => (source && reference ? { source, reference, amount: amount / 100 } : null),
    [amount, reference, source],
  );

  return {
    match,
    amount,
    setAmount,
    loadReference,
    hasReference: Boolean(reference),
    referenceName: name,
  };
}

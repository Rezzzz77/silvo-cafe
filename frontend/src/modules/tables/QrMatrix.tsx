import React, { useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

// ساخت QR به‌صورت ماتریس View — بدون هیچ وابستگی native
export function makeQr(text: string) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr;
}

type Props = { value: string; size?: number; bg?: string; fg?: string };

export default function QrMatrix({ value, size = 180, bg = '#ffffff', fg = '#111827' }: Props) {
  const cells = useMemo(() => {
    const qr = makeQr(value);
    const mods = qr.getModuleCount();
    const cell = Math.max(2, Math.floor(size / mods));
    const list: { r: number; c: number; dark: boolean; cell: number }[] = [];
    for (let r = 0; r < mods; r++) {
      for (let c = 0; c < mods; c++) {
        if (qr.isDark(r, c)) list.push({ r, c, dark: true, cell });
      }
    }
    return { mods, cell, darkCells: list };
  }, [value, size]);

  const dim = cells.cell * cells.mods;

  return (
    <View style={{ width: dim, height: dim, backgroundColor: bg, flexDirection: 'row', flexWrap: 'wrap' }}>
      {cells.darkCells.map(({ r, c, cell }) => (
        <View
          key={`${r}-${c}`}
          style={{ position: 'absolute', left: c * cell, top: r * cell, width: cell, height: cell, backgroundColor: fg }}
        />
      ))}
    </View>
  );
}

/**
 * QR palsu deterministik untuk tampilan (bukan QR pembayaran nyata).
 */
export function QrDummy({ size = 6 }: { size?: number }) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    return finder
      ? x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)
        ? 1
        : 0
      : (x * 3 + y * 7 + x * y) % 3 === 0
        ? 1
        : 0;
  });
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(21, ${size}px)`,
        gridTemplateRows: `repeat(21, ${size}px)`,
      }}
    >
      {cells.map((c, i) => (
        <div key={i} style={{ background: c ? "#1E2A5A" : "transparent" }} />
      ))}
    </div>
  );
}

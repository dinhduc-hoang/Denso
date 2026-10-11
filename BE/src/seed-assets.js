import { deflateSync } from "node:zlib";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, bytes) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, bytes])));
  return Buffer.concat([size, type, bytes, checksum]);
}
function sampleImage() {
  const width = 256;
  const height = 160;
  const pixels = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const radius = Math.hypot(x - 166, y - 80);
      let rgb = [242, 245, 248];
      if (x >= 70 && x < 155 && y >= 47 && y <= 113) rgb = [55, 69, 86];
      if (radius < 29) rgb = [104, 154, 182];
      if (radius > 32 && radius < 35) rgb = [216, 37, 45];
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      for (let channel = 0; channel < 3; channel++)
        pixels[offset + channel] = rgb[channel];
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function samplePdf() {
  const content =
    "BT /F1 14 Tf 40 790 Td (DEMO SOP-VIS-02 - illustrative data only) Tj 0 -25 Td (Scope: CAM-02 / Demo A / S-01) Tj 0 -25 Td (Inspect under approved SOP. Stop if image quality is inadequate.) Tj 0 -25 Td (Do not change PLC parameters. Escalate outside authority.) Tj 0 -25 Td (This document is a seed fixture, not a factory SOP.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
function sampleAudio() {
  const pcm = Buffer.alloc(16000);
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
export function seedAsset(mimeType) {
  if (mimeType === "image/png") return sampleImage();
  if (mimeType === "application/pdf") return samplePdf();
  if (mimeType === "audio/wav") return sampleAudio();
  throw new Error(`Unsupported seed asset type: ${mimeType}`);
}

export function detectType(buffer) {
  if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255)
    return "image/jpeg";
  if (buffer.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (buffer.subarray(0, 4).toString() === "RIFF") {
    if (buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
    if (buffer.subarray(8, 12).toString() === "WAVE") return "audio/wav";
  }
  if (buffer.subarray(0, 4).toString() === "OggS") return "audio/ogg";
  if (buffer.subarray(4, 8).toString() === "ftyp") return "audio/mp4";
  if (
    buffer.subarray(0, 3).toString() === "ID3" ||
    (buffer[0] === 255 && (buffer[1] & 224) === 224)
  )
    return "audio/mpeg";
  if (buffer.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])))
    return "audio/webm";
  return null;
}

// Minimal, dependency-free multipart/form-data parser.
// Reads the full request body into a Buffer then splits on the boundary.
// Suitable for small forms with a single photo upload at the scale this app runs at.

export function getBoundary(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return null;
  return (match[1] || match[2] || "").trim();
}

export async function readBody(req, maxBytes = 60 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  while (true) {
    const idx = buffer.indexOf(delimiter, start);
    if (idx === -1) {
      break;
    }
    parts.push(buffer.slice(start, idx));
    start = idx + delimiter.length;
  }
  return parts;
}

export function parseMultipart(bodyBuffer, boundary) {
  const fields = {};
  const files = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const rawParts = splitBuffer(bodyBuffer, boundaryBuffer);

  for (const rawPart of rawParts) {
    // Trim leading CRLF and trailing CRLF / "--" end marker.
    let part = rawPart;
    if (part.length === 0) continue;
    if (part.slice(0, 2).toString() === "--") continue; // final boundary
    if (part.slice(0, 2).toString("binary") === "\r\n") part = part.slice(2);
    // Remove trailing CRLF before next boundary
    if (part.slice(-2).toString("binary") === "\r\n") part = part.slice(0, -2);

    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headerText = part.slice(0, headerEnd).toString("utf8");
    const content = part.slice(headerEnd + 4);

    const nameMatch = headerText.match(/name="([^"]+)"/i);
    const filenameMatch = headerText.match(/filename="([^"]*)"/i);
    const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    if (filenameMatch && filenameMatch[1] !== "") {
      files[fieldName] = {
        filename: filenameMatch[1],
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream",
        data: content,
      };
    } else {
      fields[fieldName] = content.toString("utf8");
    }
  }

  return { fields, files };
}

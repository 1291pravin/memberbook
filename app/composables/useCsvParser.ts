export function useCsvParser() {
  function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    // Strip BOM
    const cleaned = text.replace(/^\uFEFF/, "");
    const lines = splitCsvLines(cleaned);

    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = parseCsvLine(lines[0]!);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;
      rows.push(parseCsvLine(line));
    }

    return { headers, rows };
  }

  function splitCsvLines(text: string): string[] {
    const lines: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      }
      else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        lines.push(current);
        current = "";
      }
      else {
        current += ch;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          }
          else {
            inQuotes = false;
          }
        }
        else {
          current += ch;
        }
      }
      else if (ch === '"') {
        inQuotes = true;
      }
      else if (ch === ",") {
        fields.push(current);
        current = "";
      }
      else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  return { parseCsv };
}

const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

// The Organization/Subject Group patch upgrades the generic array case.
// MasterForm may be compacted to a single line by a previous safe patch, so
// locate the switch branches by syntax rather than exact indentation.
if (!source.includes('case "array":')) {
  const jsonMarker = 'case "json":';
  const defaultMarker = 'default:';
  const marker = source.includes(jsonMarker) ? jsonMarker : defaultMarker;
  if (!source.includes(marker)) {
    throw new Error("MasterForm render switch marker not found; refusing unrelated modification.");
  }

  const arrayCase = `case "array":
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : value}
            onChange={(e) => handleChange(field.name, e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
            placeholder={field.placeholder || "id1, id2, id3"}
            className={baseClasses}
          />
        );
      `;
  source = source.replace(marker, `${arrayCase}${marker}`);
}

if (!source.includes('case "array":')) {
  throw new Error("MasterForm array compatibility verification failed.");
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("MasterForm array case compatibility verified.\n");

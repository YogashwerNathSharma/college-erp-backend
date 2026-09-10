const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "pages", "students", "StudentsPage.tsx");
let source = fs.readFileSync(file, "utf8");

const searchStart = "    // Search\n";
const classMarker = "\n\n    // Class filter";
const start = source.indexOf(searchStart);
const end = source.indexOf(classMarker, start);

if (start < 0 || end < 0) {
  throw new Error("StudentsPage search block not found; refusing unrelated modification.");
}

const replacement = `    // Search: keep this client-side filter aligned with the backend search fields.\n    if (search.trim()) {\n      const q = search.trim().toLowerCase();\n      const contains = (value: unknown) => String(value ?? "").toLowerCase().includes(q);\n\n      result = result.filter((s) =>\n        contains(s.fullName || ((s.firstName || "") + " " + (s.lastName || ""))) ||\n        contains(s.firstName) ||\n        contains(s.lastName) ||\n        contains(s.admissionNo) ||\n        contains(s.srNo) ||\n        contains(s.rollNumber) ||\n        contains(s.email) ||\n        contains(s.fatherName) ||\n        contains(s.phone) ||\n        contains(s.fatherPhone)\n      );\n    }\n`;

source = source.slice(0, start) + replacement + source.slice(end);

const stateMarker = '  const [genderFilter, setGenderFilter] = useState("");\n';
if (!source.includes(stateMarker)) {
  throw new Error("StudentsPage gender filter marker not found; refusing unrelated modification.");
}

const resetEffect = `\n  // Always return to the first result page when a filter/search changes.\n  // Otherwise a previous page can legitimately become empty after filtering.\n  useEffect(() => {\n    setPage(1);\n  }, [search, classFilter, sectionFilter, statusFilter, genderFilter]);\n\n`;

if (!source.includes("setPage(1);\n  }, [search, classFilter, sectionFilter, statusFilter, genderFilter]")) {
  source = source.replace(stateMarker, stateMarker + resetEffect);
}

fs.writeFileSync(file, source, "utf8");
console.log("Student list search fix applied successfully.");

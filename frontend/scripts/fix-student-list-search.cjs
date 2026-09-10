const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "pages", "students", "StudentsPage.tsx");
let source = fs.readFileSync(file, "utf8");

// Keep the student roster search fully client-side, but make the initial
// collection request resilient for tenants with larger student datasets.
const fetchStart = "  const fetchStudents = useCallback(async () => {";
const fetchEnd = "\n\n  const fetchClasses = useCallback(async () => {";
const fetchStartIndex = source.indexOf(fetchStart);
const fetchEndIndex = source.indexOf(fetchEnd, fetchStartIndex);

if (fetchStartIndex < 0 || fetchEndIndex < 0) {
  throw new Error("StudentsPage fetchStudents block not found; refusing unrelated modification.");
}

const fetchReplacement = `  const fetchStudents = useCallback(async () => {\n    setLoading(true);\n    setStudents([]);\n\n    // Start with the normal roster size. If a large tenant/API gateway rejects\n    // the payload, retry with progressively smaller pages instead of leaving\n    // the Student List empty. Search remains instant because the loaded roster\n    // is filtered locally below.\n    const limits = [1000, 500, 250];\n\n    try {\n      let lastError: any = null;\n\n      for (const limit of limits) {\n        try {\n          const res = await axios.get(\n            getFullUrl(\`/api/students?limit=\${limit}\`)!,\n            { ...authHeaders(), timeout: 15000 }\n          );\n          const payload = res.data?.data;\n          const data = payload?.students || payload || res.data?.students || [];\n\n          if (!Array.isArray(data)) throw new Error("Invalid student list response");\n          setStudents(data);\n          return;\n        } catch (err) {\n          lastError = err;\n        }\n      }\n\n      throw lastError || new Error("Failed to load students");\n    } catch (err: any) {\n      console.error("[StudentsPage] fetchStudents failed:", err);\n      toast.error(err.response?.data?.message || "Failed to load students");\n      setStudents([]);\n    } finally {\n      setLoading(false);\n    }\n  }, []);`;

source = source.slice(0, fetchStartIndex) + fetchReplacement + source.slice(fetchEndIndex);

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
console.log("Student list loading/search fix applied successfully.");

const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'pages', 'masters', 'MasterModule.tsx');
let source = fs.readFileSync(target, 'utf8');

const marker = "if (modelKey === 'syllabus-master')";
const block = `if (modelKey === 'syllabus-master') {
    const syllabusFields: FieldConfig[] = [
      { name: 'name', label: 'Syllabus Title', type: 'text', required: true },
      { name: 'classId', label: 'Class', type: 'lookup', lookupUrl: '/api/class', lookupLabelField: 'name', lookupValueField: 'id', required: true },
      { name: 'subjectId', label: 'Subject', type: 'lookup', lookupUrl: '/api/subject', lookupLabelField: 'name', lookupValueField: 'id', required: true },
      { name: 'boardId', label: 'Board', type: 'lookup', lookupUrl: '/api/masters/board-master/dropdown', lookupLabelField: 'name', lookupValueField: 'id' },
      { name: 'content', label: 'Content / Topics', type: 'textarea' },
    ];
    return syllabusFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
  }
  `;

if (!source.includes(marker)) {
  const anchor = "if (modelKey === 'elective-subject-master')";
  if (!source.includes(anchor)) {
    throw new Error('Could not find master field resolver anchor');
  }
  source = source.replace(anchor, block + anchor);
}

const requiredMarkers = [
  "{ name: 'classId', label: 'Class', type: 'lookup', lookupUrl: '/api/class'",
  "{ name: 'subjectId', label: 'Subject', type: 'lookup', lookupUrl: '/api/subject'",
  "{ name: 'boardId', label: 'Board', type: 'lookup', lookupUrl: '/api/masters/board-master/dropdown'",
];
for (const required of requiredMarkers) {
  if (!source.includes(required)) throw new Error(`Syllabus lookup marker missing: ${required}`);
}

fs.writeFileSync(target, source);
console.log('Syllabus Master lookup fields ensured.');

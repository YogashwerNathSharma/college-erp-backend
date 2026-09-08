const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const schemaFile = path.join(root, 'prisma/schema.prisma');

if (!fs.existsSync(schemaFile)) process.exit(0);

let content = fs.readFileSync(schemaFile, 'utf8');

function patchModelField(modelName, fieldLine, anchorRegex) {
  const modelRegex = new RegExp(`(model\\s+${modelName}\\s*\\{)([\\s\\S]*?)(\\n\\})`);
  const match = content.match(modelRegex);
  if (!match) throw new Error(`Model ${modelName} not found in schema.prisma`);
  if (match[2].includes(fieldLine.trim())) return;
  const body = match[2];
  const patchedBody = anchorRegex.test(body)
    ? body.replace(anchorRegex, (m) => `${m}\n${fieldLine}`)
    : `${body}\n${fieldLine}`;
  content = content.replace(match[0], `${match[1]}${patchedBody}${match[3]}`);
}

patchModelField(
  'ResultType',
  '  calculationMode String? @default("AUTOMATIC")',
  /\\bformula\\s+String\\?/i
);

patchModelField(
  'ResultSummary',
  '  cgpa           Float?',
  /\\bpercentage\\s+Float/i
);

fs.writeFileSync(schemaFile, content, 'utf8');
console.log('Result calculation schema fields ensured.');

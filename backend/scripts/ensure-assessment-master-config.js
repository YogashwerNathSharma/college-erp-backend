const fs = require("fs");
const path = require("path");

const sourceConfigPath = path.resolve(__dirname, "../src/modules/masters/master.config.ts");
const distConfigPath = path.resolve(__dirname, "../dist/modules/masters/master.config.js");

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  const from = "key: 'assessment-master',\n        label: 'Assessment Master',\n        model: 'Assessment',";
  const to = "key: 'assessment-master',\n        label: 'Assessment Master',\n        model: 'AssessmentMaster',";
  if (content.includes(from)) {
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return content.includes(to);
}

patchFile(sourceConfigPath);
patchFile(distConfigPath);

const sourceConfig = fs.readFileSync(sourceConfigPath, "utf8");
if (!sourceConfig.includes("key: 'assessment-master',\n        label: 'Assessment Master',\n        model: 'AssessmentMaster',")) {
  throw new Error("Assessment Master config verification failed: model must be AssessmentMaster");
}

process.stdout.write("Assessment Master config verified: CRUD uses AssessmentMaster.\n");

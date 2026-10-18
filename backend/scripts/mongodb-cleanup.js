/**
 * ============================================================================
 * MongoDB Cleanup Script - Drop Old Unused Collections
 * ============================================================================
 * 
 * PURPOSE:
 *   The College ERP project was refactored and 109 old *Master collections
 *   plus 10 merged/deprecated collections are no longer in use. MongoDB Atlas
 *   has a 500 collection limit per cluster, and these unused collections are
 *   consuming that quota. This script safely drops them.
 *
 * TOTAL COLLECTIONS TO DROP: 119 (109 old *Master + 10 merged/deprecated)
 *
 * HOW TO RUN:
 *   mongosh "mongodb+srv://collegeerp.o2miyik.mongodb.net/CollegeERP" \
 *     --username <your-username> \
 *     --file scripts/mongodb-cleanup.js
 *
 *   You will be prompted for your password. Alternatively:
 *   mongosh "mongodb+srv://<user>:<password>@collegeerp.o2miyik.mongodb.net/CollegeERP" \
 *     --file scripts/mongodb-cleanup.js
 *
 * SAFETY:
 *   - Only drops collections that actually exist in the database
 *   - Prints progress for each collection (skipped or dropped)
 *   - Shows a summary with final collection count
 *   - Does NOT drop any collections outside the explicit list below
 *
 * DATE: 2026-07-31
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Old *Master collections (109) - replaced during ERP refactor
// Mongoose stores these as lowercase + pluralized by default
// ---------------------------------------------------------------------------

const oldMasterCollections = [
  // School & Branch
  "schoolmasters",
  "branchmasters",
  "campusmasters",
  "shiftmasters",
  "workingdaymasters",
  "holidaymasters",
  "housemasters",
  "schooltimingmasters",

  // Academics
  "streammasters",
  "subjectgroupmasters",
  "electivesubjectmasters",
  "mediummasters",
  "boardmasters",
  "coursemasters",
  "syllabusmasters",
  "periodmasters",
  "timetableslotmasters",

  // Admission & Student
  "admissiontypemasters",
  "categorymasters",
  "religionmasters",
  "castemasters",
  "nationalitymasters",
  "bloodgroupmasters",
  "mothertonguemasters",
  "studentstatusmasters",
  "siblingrelationmasters",

  // Staff / HR
  "departmentmasters",
  "designationmasters",
  "employmenttypemasters",
  "qualificationmasters",
  "leavetypemasters",
  "staffcategorymasters",
  "salarygrademasters",
  "bankmasters",

  // Fee & Finance
  "feegroupmasters",
  "feetypemasters",
  "concessionmasters",
  "scholarshipmasters",
  "paymentmodemasters",
  "receiptseriesmasters",

  // Examination
  "examtypemasters",
  "examtermmasters",
  "resulttypemasters",
  "markingschememasters",
  "assessmentmasters",

  // Attendance
  "attendancestatusmasters",
  "latefinemasters",
  "leavereasonmasters",
  "attendanceshiftmasters",

  // Library
  "publishermasters",
  "authormasters",
  "languagemasters",
  "rackmasters",
  "shelfmasters",
  "bookconditionmasters",

  // Hostel
  "blockmasters",
  "floormasters",
  "bedmasters",
  "hosteltypemasters",

  // Transport
  "drivermasters",
  "conductormasters",
  "fueltypemasters",
  "gpsdevicemasters",

  // Inventory / Store
  "itemcategorymasters",
  "itemgroupmasters",
  "unitmasters",
  "brandmasters",
  "suppliermasters",
  "warehousemasters",
  "storemasters",
  "stocktypemasters",

  // Payroll
  "payrollheadmasters",
  "salarycomponentmasters",
  "pfmasters",
  "esimasters",
  "taxslabmasters",
  "incrementtypemasters",

  // Communication & Templates
  "smstemplatemasters",
  "emailtemplatemasters",
  "whatsapptemplatemasters",
  "notificationtemplatemasters",
  "noticecategorymasters",
  "certificatetemplatemasters",
  "idcardtemplatemasters",

  // Access Control & Roles
  "rolemasters",
  "permissionmasters",
  "usertypemasters",
  "modulemasters",
  "menumasters",
  "apipermissionmasters",

  // Documents & Workflows
  "documenttypemasters",
  "documentcategorymasters",
  "approvalworkflowmasters",

  // Events & Visitors
  "eventcategorymasters",
  "venuemasters",
  "eventtypemasters",
  "visitortypemasters",
  "purposemasters",
  "gatemasters",

  // AI & Analytics
  "aipromptmasters",
  "predictionrulemasters",
  "analyticsrulemasters",

  // System & Config
  "thememasters",
  "currencymasters",
  "timezonemasters",
  "backuppolicymasters",
  "audittypemasters",
  "apiprovidermasters",
  "settingsmasters",
];

// ---------------------------------------------------------------------------
// Old merged/deprecated collections (10)
// These were consolidated into other models during the refactor
// ---------------------------------------------------------------------------

const oldMergedCollections = [
  "teacherleaves",
  "leaverequests",
  "supporttickets",
  "supportticketcomments",
  "transportpickupdrops",
  "transporttrips",
  "vehiclelocationhistories",
  "systemsettings",
  "platformsettings",
  "settings",
];

// ---------------------------------------------------------------------------
// Combine all collections to drop
// ---------------------------------------------------------------------------

const allCollectionsToDrop = [...oldMasterCollections, ...oldMergedCollections];

// ---------------------------------------------------------------------------
// Main cleanup logic
// ---------------------------------------------------------------------------

print("\n" + "=".repeat(70));
print("  MongoDB Cleanup - Dropping Old Unused Collections");
print("  Database: " + db.getName());
print("  Total candidates: " + allCollectionsToDrop.length);
print("=".repeat(70) + "\n");

// Get list of existing collections in the database
const existingCollections = db.getCollectionNames();
const existingSet = new Set(existingCollections);

print(`Current collection count: ${existingCollections.length}\n`);
print("-".repeat(70));

let dropped = 0;
let skipped = 0;
let errors = 0;

for (const collName of allCollectionsToDrop) {
  if (existingSet.has(collName)) {
    try {
      db.getCollection(collName).drop();
      dropped++;
      print(`  [DROPPED]  ${collName}`);
    } catch (e) {
      errors++;
      print(`  [ERROR]    ${collName} - ${e.message}`);
    }
  } else {
    skipped++;
    print(`  [SKIPPED]  ${collName} (does not exist)`);
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const finalCollections = db.getCollectionNames();

print("\n" + "-".repeat(70));
print("\n  CLEANUP SUMMARY");
print("  " + "-".repeat(40));
print(`  Collections dropped:   ${dropped}`);
print(`  Collections skipped:   ${skipped} (did not exist)`);
print(`  Errors:                ${errors}`);
print(`  ` + "-".repeat(40));
print(`  Collections before:    ${existingCollections.length}`);
print(`  Collections after:     ${finalCollections.length}`);
print(`  Space freed (slots):   ${existingCollections.length - finalCollections.length}`);
print(`  Atlas limit:           500`);
print(`  Headroom remaining:    ${500 - finalCollections.length}\n`);
print("=".repeat(70));
print("  Cleanup complete!");
print("=".repeat(70) + "\n");

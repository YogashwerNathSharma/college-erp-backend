/**
 * 🔧 DIRECT MongoDB Fix - Delete duplicate admission numbers
 * Run this: node scripts/direct-db-fix.js
 */

const { MongoClient } = require("mongodb");

async function fixDatabase() {
  const uri =
    "mongodb+srv://cluster0:password@your-cluster.mongodb.net/college-erp?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
    console.log("🔧 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("college-erp");
    const studentsCollection = db.collection("Student");
    const counterCollection = db.collection("AdmissionCounter");

    // Step 1: Get the problematic tenant
    const tenantId = "6a20567f17915b09d64bc57a";
    const academicYearId = "6a44ea6d85073bfac0c2d0aa";

    console.log("\n📊 Checking current state...");

    // Count students
    const studentCount = await studentsCollection.countDocuments({
      tenantId,
      academicYearId,
    });
    console.log(`✅ Total students: ${studentCount}`);

    // Get max admission number
    const lastStudent = await studentsCollection
      .find({ tenantId, academicYearId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (lastStudent.length > 0) {
      console.log(`✅ Last admission: ${lastStudent[0].admissionNo}`);
    }

    // Step 2: Delete ALL counters for this tenant
    console.log("\n🗑️  Deleting old counters...");
    const deleteResult = await counterCollection.deleteMany({ tenantId });
    console.log(`✅ Deleted ${deleteResult.deletedCount} counter(s)`);

    // Step 3: Create fresh counter with correct number
    console.log("\n✨ Creating fresh counter...");
    await counterCollection.insertOne({
      tenantId,
      academicYearId,
      prefix: "ADM",
      lastNumber: studentCount + 1, // Next number to use
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Counter set to: ${studentCount + 1}`);
    console.log("\n🚀 Database fix complete!");
    console.log("Restart backend: npm run dev");
    console.log("Then try creating admission again!\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
  }
}

fixDatabase();

import ExcelJS from "exceljs";

export const generateExcel = async (data: any) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fees Report");

  sheet.columns = [
    { header: "Class", key: "class", width: 20 },
    { header: "Total", key: "total", width: 15 },
    { header: "Paid", key: "paid", width: 15 },
    { header: "Pending", key: "pending", width: 15 },
    { header: "Students", key: "students", width: 15 },
  ];

  Object.entries(data.classReport).forEach(([cls, val]: any) => {
    sheet.addRow({
      class: cls,
      total: val.total,
      paid: val.paid,
      pending: val.pending,
      students: val.students,
    });
  });

  sheet.addRow({});
  sheet.addRow({
    class: "TOTAL",
    total: data.collection.totalCollection,
    pending: data.defaulters.totalPending,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
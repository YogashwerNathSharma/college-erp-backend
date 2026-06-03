import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 College cum School, developed by yogashwer nath sharma , Erp Server running on port ${PORT}`);
});
# 🧪 College ERP — Testing Checklist

> Flow-wise testing guide for every module. Test in this order.  
> ✅ = Pass | ❌ = Fail | ⏭️ = Skipped (no data)

---

## 🔐 1. Authentication & Authorization

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1.1 | Open app → redirects to `/login` | Login page shows | |
| 1.2 | Login with wrong credentials | "Invalid credentials" error | |
| 1.3 | Login with Admin account | Redirects to `/dashboard` | |
| 1.4 | Check sidebar shows all modules | All menu items visible | |
| 1.5 | Logout → try accessing `/dashboard` | Redirects to login | |
| 1.6 | Expired token → API call | 401 Unauthorized, redirects to login | |
| 1.7 | Login as Teacher role | Limited sidebar (no admin features) | |
| 1.8 | Subscription expired check | Shows "subscription expired" page | |

---

## 📊 2. Dashboard

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 2.1 | Dashboard loads | No errors, stats cards show | |
| 2.2 | Student count card | Shows correct number | |
| 2.3 | Teacher count card | Shows correct number | |
| 2.4 | Fee collection stats | Collected / Pending amounts | |
| 2.5 | Attendance today | Percentage shows | |
| 2.6 | Quick links work | Navigate to respective pages | |
| 2.7 | Charts/graphs render | No blank areas | |

---

## 👨🎓 3. Student Module

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 3.1 | `/students` → Student list loads | Table with pagination | |
| 3.2 | Search student by name | Filtered results | |
| 3.3 | Filter by class/section | Correct filtering | |
| 3.4 | Click student → Profile page | Full details shown | |
| 3.5 | **New Admission** → form loads | All fields + dropdowns populated | |
| 3.6 | Dropdowns (Blood Group, Religion, Category) | Fetched from Masters API (not hardcoded) | |
| 3.7 | Submit admission form | Student created, success toast | |
| 3.8 | Edit student details | Updates saved | |
| 3.9 | Delete/Deactivate student | Soft delete works | |
| 3.10 | Student ID Card page | Card renders with photo | |
| 3.11 | Print ID Card | Print dialog opens, card formatted | |
| 3.12 | Student Reports page | Reports generate | |
| 3.13 | Promotion | Move students to next class | |

---

## 👨🏫 4. Teacher Module

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 4.1 | `/teachers` → Teacher list | Table loads | |
| 4.2 | Add new teacher | Form with department/designation dropdowns | |
| 4.3 | Dropdowns from Masters | Department, Designation, Qualification fetched | |
| 4.4 | Edit teacher | Updates saved | |
| 4.5 | Teacher ID Card | Renders correctly | |
| 4.6 | Print Teacher ID | Print works | |
| 4.7 | Leave Management | Leave types from Masters API | |
| 4.8 | Apply leave | Creates leave request | |
| 4.9 | Teacher Salary | Salary details show | |
| 4.10 | Teacher Documents | Upload/view documents | |

---

## 📋 5. Attendance

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 5.1 | `/attendance` → Mark attendance page | Class/Section selector shows | |
| 5.2 | Select class + section | Student list loads | |
| 5.3 | Mark Present/Absent/Late | Checkboxes/buttons work | |
| 5.4 | Submit attendance | Saved, success toast | |
| 5.5 | Same date re-open | Shows previously marked data | |
| 5.6 | Attendance Report | Monthly/daily view | |
| 5.7 | Print attendance report | Print dialog works | |
| 5.8 | Student-wise attendance | Individual record shows | |

---

## 💰 6. Fee Management

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 6.1 | `/fees` → Fee Dashboard | Stats cards + charts | |
| 6.2 | Fee Structure | List of fee heads per class | |
| 6.3 | Add Fee Head | Form works | |
| 6.4 | Fee Collection page | Search student, show pending | |
| 6.5 | Payment Modes dropdown | From Masters API (not hardcoded) | |
| 6.6 | Collect fee → Print receipt | Payment saved + receipt generated | |
| 6.7 | **Print Fee Receipt** | Opens print dialog, formatted receipt | |
| 6.8 | Student Ledger | Full payment history | |
| 6.9 | Defaulters list | Students with pending fees | |
| 6.10 | Fee Reports | Collection summary | |

---

## 📝 7. Exam & Results

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 7.1 | `/exams` → Exam list | Shows exams | |
| 7.2 | Create new exam | Form works | |
| 7.3 | Add subjects to exam | Subject picker works | |
| 7.4 | Exam Schedule | Set date/room/invigilator | |
| 7.5 | **Marks Entry** | Grid loads, enter marks | |
| 7.6 | Save marks | Marks saved per student | |
| 7.7 | Grade Settings | Auto grade calculation | |
| 7.8 | **Report Card** → Select exam + student | Report card renders | |
| 7.9 | **Print Report Card** | Print dialog, A4 formatted | |
| 7.10 | **Download PDF** | PDF file downloads | |
| 7.11 | **Bulk Report Card** | Multiple students, paginated | |
| 7.12 | **Admit Card** | Renders with exam schedule | |
| 7.13 | Print Admit Card | Print works | |
| 7.14 | Consolidated Report | Multi-exam student view | |

---

## 📚 8. Library

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 8.1 | `/library` → Dashboard | Stats + book count | |
| 8.2 | Book list | Table with search | |
| 8.3 | Add new book | Form works | |
| 8.4 | Issue book to student | Select student, issue | |
| 8.5 | Return book | Mark as returned | |
| 8.6 | Overdue books list | Shows pending returns | |
| 8.7 | Fine calculation | Auto fine for late returns | |

---

## 🚌 9. Transport

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 9.1 | `/transport` → Dashboard | Vehicle/Route stats | |
| 9.2 | Vehicle list | Shows all vehicles | |
| 9.3 | Add vehicle | Form works | |
| 9.4 | Routes + Stops | Route management | |
| 9.5 | Assign student to route | Assignment works | |
| 9.6 | Transport fee | Fee linked to transport | |

---

## 🏨 10. Hostel

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 10.1 | `/hostel` → Room Allocation | Hostel list loads | |
| 10.2 | View rooms | Room grid/table | |
| 10.3 | Allocate student to room | Allocation form | |
| 10.4 | Deallocate | Remove student from room | |
| 10.5 | **Hostel Fees** page | Loads without error (no Malformed ObjectID) | |
| 10.6 | Mess Management | Weekly menu shows | |
| 10.7 | Edit mess menu | Save menu items | |

---

## 📦 11. Inventory

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 11.1 | `/inventory/assets` → Asset List | Table loads (not blank page) | |
| 11.2 | Add new asset | Form, select category/condition | |
| 11.3 | Edit asset | Updates saved | |
| 11.4 | Delete asset | Soft delete | |
| 11.5 | **Inventory Dashboard** | Stats cards show numbers | |
| 11.6 | Issue asset to staff | Issue form works | |
| 11.7 | Return asset | Return recorded | |
| 11.8 | Stock Management | Stock items + transactions | |

---

## 🚪 12. Gate Pass

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 12.1 | `/gate-pass` → Dashboard | Stats (today's visitors, pending) | |
| 12.2 | Create new gate pass | Visitor form | |
| 12.3 | Approve/Reject | Status change works | |
| 12.4 | Mark entry (IN) | Entry time recorded | |
| 12.5 | Mark exit (OUT) | Exit time recorded | |
| 12.6 | Visitor log (today) | List of today's visitors | |
| 12.7 | Settings | Purpose list, working hours | |

---

## 🗃️ 13. Masters Module

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 13.1 | `/masters` → Categories load | 20 categories in sidebar | |
| 13.2 | Click any category → models show | Model list appears | |
| 13.3 | Click model → entries load | Table with data | |
| 13.4 | **Add new entry** | Form auto-generated from config | |
| 13.5 | Fill form → Submit | Entry created, appears in list | |
| 13.6 | Edit entry | Modal with existing data | |
| 13.7 | Toggle active/inactive | Status changes | |
| 13.8 | Delete entry | Soft delete (disappears from active list) | |
| 13.9 | Search entries | Filtered by name/code | |
| 13.10 | Pagination | Next/prev pages work | |

---

## 🎖️ 14. Certificates

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 14.1 | `/certificates` → TC page | Form to generate TC | |
| 14.2 | Select student → Generate TC | TC renders | |
| 14.3 | **Print TC** | Print dialog, proper format | |
| 14.4 | Character Certificate | Generate + Print | |
| 14.5 | Migration Certificate | Generate + Print | |
| 14.6 | Certificate Generator | Templates work | |

---

## 🤖 15. AI Assistant

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 15.1 | `/ai` → AI page loads | Chat interface shows | |
| 15.2 | Type "How many students?" | Returns count from DB | |
| 15.3 | "Pending fees?" | Returns fee stats | |
| 15.4 | Performance analysis | Insights generate | |
| 15.5 | Attendance prediction | At-risk students show | |
| 15.6 | Insights panel | Auto-generated alerts | |

---

## ⏰ 16. Timetable

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 16.1 | `/timetable` → Loads | Class/section selector | |
| 16.2 | Select class | Timetable grid shows | |
| 16.3 | Add/Edit period | Teacher + Subject picker | |
| 16.4 | **Print Timetable** | Print formatted table | |

---

## 💼 17. HR Module

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 17.1 | `/hr` → Dashboard | Staff stats | |
| 17.2 | Staff Attendance | Mark present/absent | |
| 17.3 | Payroll | Salary generation | |
| 17.4 | **Print Salary Slip** | Print formatted slip | |

---

## 📱 18. Communication

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 18.1 | `/communication` → Notices | Notice list | |
| 18.2 | Create notice | Form + send | |
| 18.3 | Circular creation | PDF circular | |
| 18.4 | SMS/WhatsApp logs | Sent message list | |

---

## ⚙️ 19. Settings

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 19.1 | `/settings` → General | School info editable | |
| 19.2 | Theme settings | Color changes apply | |
| 19.3 | User management | Add/edit users | |
| 19.4 | Backup settings | Backup schedule | |
| 19.5 | Signature Master | Upload signatures | |

---

## 🖨️ 20. Print / PDF Summary

| Feature | Page | Print | PDF | Card |
|---------|------|-------|-----|------|
| Report Card | `/exams/report-card` | ✅ | ✅ | — |
| Bulk Report Card | `/exams/bulk-report` | ✅ | ✅ | — |
| Admit Card | `/exams/admit-card` | ✅ | ✅ | — |
| Fee Receipt | `/fees/receipt` | ✅ | — | — |
| Student ID Card | `/students/id-card` | ✅ | — | ✅ |
| Teacher ID Card | `/teachers/id-card` | ✅ | — | ✅ |
| Transfer Certificate | `/certificates/tc` | ✅ | — | — |
| Character Certificate | `/certificates/cc` | ✅ | — | — |
| Timetable | `/timetable/print` | ✅ | — | — |
| Attendance Report | `/attendance-report` | ✅ | — | — |
| Student List | `/students/print` | ✅ | ✅ | — |
| Salary Slip | `/hr/payroll` | ✅ | — | — |

---

## 🧪 Testing Tips

1. **First run seed** before testing:
   ```bash
   cd backend
   npx ts-node prisma/seed-full-erp.ts
   ```

2. **Default Login Credentials** (from seed):
   - Admin: Check your seed for email/password
   - Teacher: Any teacher email from seed

3. **If page is blank**: Open browser DevTools (F12) → Console tab → check error

4. **If "Failed to fetch"**: Check Network tab → look at the API response status code

5. **Print testing**: Use Chrome/Edge, click Print → verify layout in print preview

6. **After fixing a bug**: Restart backend (`npm run dev`) then refresh frontend

---

## 📌 Known Limitations

- Hostel Fees: Stub only (returns empty data, full implementation pending)
- Some modules show "0" or "No records" — this is normal if no seed data
- YN-UDP templates require the yn-udp server to be running separately
- AI Assistant uses rule-based NLP (not GPT) — limited query understanding

---

*Created: June 29, 2026*

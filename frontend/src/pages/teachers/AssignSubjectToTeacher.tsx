import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;
const auth = (yearId?: string) => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}`, ...(yearId ? { "x-academic-year-id": yearId } : {}) } });
const unwrap = (value: any): any[] => {
  const candidates = [value?.data?.data, value?.data, value];
  return candidates.find(Array.isArray) || [];
};

interface Assignment { id: string; classId: string; subjectId: string; className?: string; subjectName?: string; type: string; }

const AssignSubjectToTeacher = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchYearsAndTeachers = async () => {
    try {
      const [teacherRes, yearRes] = await Promise.all([axios.get(`${API}/teacher`, auth()), axios.get(`${API}/academic`, auth())]);
      const years = unwrap(yearRes.data); setAcademicYears(years);
      const current = years.find((y:any)=>y.isCurrent) || years.find((y:any)=>y.isActive) || years[0];
      if (!selectedYear && current?.id) setSelectedYear(current.id);
      setTeachers(unwrap(teacherRes.data));
    } catch (err) { console.error(err); toast.error("Failed to load teachers or academic years"); }
  };

  const fetchYearResources = async (yearId:string) => {
    if (!yearId) return;
    try {
      const cfg = { ...auth(yearId), params:{ academicYearId:yearId } };
      const [classRes, subjectRes] = await Promise.all([axios.get(`${API}/class`,cfg), axios.get(`${API}/subject`,cfg)]);
      setClasses(unwrap(classRes.data)); setSubjects(unwrap(subjectRes.data));
      const teacherRes = await axios.get(`${API}/teacher`, auth(yearId));
      setTeachers(unwrap(teacherRes.data));
    } catch(err){ console.error(err); setClasses([]); setSubjects([]); toast.error("Failed to load classes or subjects for selected year"); }
  };

  useEffect(()=>{fetchYearsAndTeachers();},[]);
  useEffect(()=>{if(selectedYear) fetchYearResources(selectedYear);},[selectedYear]);
  useEffect(()=>{if(selectedTeacher&&selectedYear) loadExistingAssignments(); else setAssignments([]);},[selectedTeacher,selectedYear]);

  const loadExistingAssignments = async()=>{
    try {
      const cfg={...auth(selectedYear),params:{academicYearId:selectedYear}};
      const [teacherRes,subjectRes]=await Promise.all([axios.get(`${API}/teacher/${selectedTeacher}`,cfg),axios.get(`${API}/subject`,cfg)]);
      if(!teacherRes.data?.success){setAssignments([]);return;}
      const teacher=teacherRes.data.data||{}; const yearSubjects=unwrap(subjectRes.data); const teacherSubjects=Array.isArray(teacher.subjects)?teacher.subjects:[];
      const subjectById=new Map(yearSubjects.map((s:any)=>[s.id,s]));
      const existing:Assignment[]=teacherSubjects.map((sub:any,i:number)=>{const subjectId=sub.id||sub.subjectId||sub.subject?.id||""; const resource:any=subjectById.get(subjectId)||sub.subject||sub; const classId=sub.classId||resource?.classId||resource?.class?.id||sub.class?.id||""; return {id:`existing-${subjectId||i}-${classId}`,classId,subjectId,className:resource?.class?.name||"",subjectName:resource?.name||sub.name||"",type:sub.type||"Theory"};}).filter((a:Assignment)=>a.subjectId&&a.classId);
      setAssignments(existing);
    } catch(err){console.error(err);setAssignments([]);}
  };

  const addRow=()=>setAssignments(p=>[...p,{id:`new-${Date.now()}-${Math.random()}`,classId:"",subjectId:"",type:"Theory"}]);
  const removeRow=(id:string)=>setAssignments(p=>p.filter(a=>a.id!==id));
  const updateRow=(id:string,field:keyof Assignment,value:string)=>setAssignments(p=>p.map(a=>a.id===id?{...a,[field]:value,...(field==="classId"?{subjectId:""}:{})}:a));
  const getFilteredSubjects=(classId:string)=>subjects.filter((s:any)=>s.classId===classId);

  const handleSave=async()=>{
    if(!selectedTeacher)return toast.error("Please select a teacher"); if(!selectedYear)return toast.error("Please select an academic year"); if(!assignments.length)return toast.error("Please add at least one assignment"); if(assignments.some(a=>!a.classId||!a.subjectId))return toast.error("Please fill all fields in each row");
    const seen=new Set<string>(); const exactAssignments=assignments.map(r=>({classId:r.classId,subjectId:r.subjectId}));
    for(const row of exactAssignments){const key=`${row.classId}:${row.subjectId}`;if(seen.has(key))return toast.error("The same subject cannot be assigned twice to the same class");seen.add(key);}
    setLoading(true);
    try {
      const payload={academicYearId:selectedYear,assignments:exactAssignments};
      const res=await axios.post(`${API}/teacher/${selectedTeacher}/assignments`,payload,auth(selectedYear));
      if(res.data?.success){toast.success("Assignments saved successfully");await loadExistingAssignments();}else toast.error(res.data?.message||"Failed to save assignments");
    } catch(err:any){console.error("Assignment save failed",err?.response?.data||err);toast.error(err?.response?.data?.message||"Failed to save assignments");} finally{setLoading(false);}
  };

  const selectClass="w-full min-w-0 h-11 px-3 bg-transparent border border-slate-500 rounded-lg text-sm text-inherit outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  return <div className="w-full min-w-0 p-3 sm:p-4 md:p-6 overflow-x-hidden">
    <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Assign Subject to Teacher</h1>
    <div className="w-full min-w-0 rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-sm font-medium mb-1">Teacher *</label><select value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)} className={selectClass}><option value="">Select Teacher</option>{teachers.map((t:any)=><option key={t.id} value={t.id}>{t.name||`${t.firstName||""} ${t.lastName||""}`.trim()}</option>)}</select></div>
      <div><label className="block text-sm font-medium mb-1">Academic Year *</label><select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className={selectClass}><option value="">Select Year</option>{academicYears.map((y:any)=><option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
    </div></div>
    {selectedTeacher&&selectedYear&&<div className="w-full min-w-0 rounded-lg shadow overflow-hidden">
      <div className="hidden md:block overflow-x-auto"><table className="w-full table-auto"><thead className="border-b"><tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Class</th><th className="px-4 py-3 text-left">Subject</th><th className="px-4 py-3 text-left">Type</th><th>Action</th></tr></thead><tbody>{assignments.map((r,i)=><tr key={r.id} className="border-b"><td className="px-4 py-3">{i+1}</td><td className="px-4 py-3"><select value={r.classId} onChange={e=>updateRow(r.id,"classId",e.target.value)} className={selectClass}><option value="">Select Class</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></td><td className="px-4 py-3"><select value={r.subjectId} onChange={e=>updateRow(r.id,"subjectId",e.target.value)} className={selectClass}><option value="">Select Subject</option>{getFilteredSubjects(r.classId).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></td><td className="px-4 py-3"><select value={r.type} onChange={e=>updateRow(r.id,"type",e.target.value)} className={selectClass}><option>Theory</option><option>Practical</option></select></td><td><button onClick={()=>removeRow(r.id)} className="p-2 text-red-500"><FiTrash2/></button></td></tr>)}</tbody></table></div>
      <div className="md:hidden p-3 space-y-3">{!assignments.length&&<div className="p-4 text-center">No assignments yet. Tap “Add More”.</div>}{assignments.map((r,i)=><div key={r.id} className="rounded-xl border border-slate-600 p-3 space-y-3"><div className="flex justify-between"><b>Assignment {i+1}</b><button onClick={()=>removeRow(r.id)} className="text-red-500"><FiTrash2/></button></div><select value={r.classId} onChange={e=>updateRow(r.id,"classId",e.target.value)} className={selectClass}><option value="">Select Class</option>{classes.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={r.subjectId} onChange={e=>updateRow(r.id,"subjectId",e.target.value)} className={selectClass}><option value="">Select Subject</option>{getFilteredSubjects(r.classId).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={r.type} onChange={e=>updateRow(r.id,"type",e.target.value)} className={selectClass}><option>Theory</option><option>Practical</option></select></div>)}</div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between p-4 border-t"><button onClick={addRow} className="min-h-11 flex items-center justify-center gap-2 px-4 border border-primary-600 rounded-lg"><FiPlus/> Add More</button><button onClick={handleSave} disabled={loading} className="min-h-11 flex items-center justify-center gap-2 px-5 bg-primary-600 text-white rounded-lg"><FiSave/> {loading?"Saving...":"Save Assignment"}</button></div>
    </div>}
  </div>;
};
export default AssignSubjectToTeacher;

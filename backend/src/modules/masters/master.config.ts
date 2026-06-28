// ═══════════════════════════════════════════════════════════════════
// MASTER MODULE CONFIGURATION
// Defines all 20 master categories with their models, fields, and search config
// ═══════════════════════════════════════════════════════════════════

export interface MasterField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'boolean' | 'textarea' | 'color' | 'url' | 'json' | 'array';
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
}

export interface MasterModelConfig {
  key: string;
  label: string;
  model: string;
  icon?: string;
  description?: string;
  requiredFields: string[];
  searchFields: string[];
  fields: MasterField[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
}

export interface MasterCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  models: MasterModelConfig[];
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  // ─────────────────────────────────────────────
  // 1. Organization Masters
  // ─────────────────────────────────────────────
  {
    id: 'organization',
    label: 'Organization Masters',
    icon: 'Building2',
    description: 'School, branch, campus and organizational settings',
    models: [
      {
        key: 'school-master',
        label: 'School Master',
        model: 'SchoolMaster',
        icon: 'School',
        description: 'Manage school/institution details',
        requiredFields: ['name'],
        searchFields: ['name', 'code', 'email'],
        fields: [
          { name: 'name', label: 'School Name', type: 'text', required: true },
          { name: 'code', label: 'School Code', type: 'text' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'pincode', label: 'Pincode', type: 'text' },
          { name: 'phone', label: 'Phone', type: 'phone' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'logo', label: 'Logo URL', type: 'url' },
          { name: 'affiliation', label: 'Affiliation', type: 'text' },
          { name: 'establishedYear', label: 'Established Year', type: 'number', min: 1800, max: 2100 },
          { name: 'principalName', label: 'Principal Name', type: 'text' },
        ],
      },
      {
        key: 'branch-master',
        label: 'Branch Master',
        model: 'BranchMaster',
        icon: 'GitBranch',
        description: 'Manage school branches',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Branch Name', type: 'text', required: true },
          { name: 'code', label: 'Branch Code', type: 'text' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'pincode', label: 'Pincode', type: 'text' },
          { name: 'phone', label: 'Phone', type: 'phone' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'isMain', label: 'Is Main Branch', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'campus-master',
        label: 'Campus Master',
        model: 'CampusMaster',
        icon: 'MapPin',
        description: 'Manage campus locations',
        requiredFields: ['name'],
        searchFields: ['name', 'address'],
        fields: [
          { name: 'name', label: 'Campus Name', type: 'text', required: true },
          { name: 'branchId', label: 'Branch', type: 'text' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'capacity', label: 'Capacity', type: 'number' },
          { name: 'facilities', label: 'Facilities (comma-separated)', type: 'text' },
        ],
      },
      {
        key: 'academic-session-master',
        label: 'Academic Session Master',
        model: 'AcademicSessionMaster',
        icon: 'Calendar',
        description: 'Manage academic sessions',
        requiredFields: ['name', 'startDate', 'endDate'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Session Name', type: 'text', required: true, placeholder: 'e.g., 2024-25' },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'isCurrent', label: 'Is Current Session', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'shift-master',
        label: 'Shift Master',
        model: 'ShiftMaster',
        icon: 'Clock',
        description: 'Manage school shifts',
        requiredFields: ['name', 'startTime', 'endTime'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Shift Name', type: 'text', required: true, placeholder: 'e.g., Morning Shift' },
          { name: 'startTime', label: 'Start Time', type: 'text', required: true, placeholder: '08:00' },
          { name: 'endTime', label: 'End Time', type: 'text', required: true, placeholder: '14:00' },
        ],
      },
      {
        key: 'working-day-master',
        label: 'Working Day Master',
        model: 'WorkingDayMaster',
        icon: 'CalendarDays',
        description: 'Configure working days',
        requiredFields: ['dayOfWeek'],
        searchFields: ['dayOfWeek'],
        fields: [
          { name: 'dayOfWeek', label: 'Day of Week', type: 'select', required: true, options: [
            { label: 'Sunday', value: '0' }, { label: 'Monday', value: '1' }, { label: 'Tuesday', value: '2' },
            { label: 'Wednesday', value: '3' }, { label: 'Thursday', value: '4' }, { label: 'Friday', value: '5' },
            { label: 'Saturday', value: '6' },
          ]},
          { name: 'isWorking', label: 'Is Working Day', type: 'boolean', defaultValue: true },
          { name: 'halfDay', label: 'Half Day', type: 'boolean', defaultValue: false },
          { name: 'startTime', label: 'Start Time', type: 'text' },
          { name: 'endTime', label: 'End Time', type: 'text' },
        ],
      },
      {
        key: 'holiday-master',
        label: 'Holiday Master',
        model: 'HolidayMaster',
        icon: 'Palmtree',
        description: 'Manage holidays and vacations',
        requiredFields: ['name', 'date'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Holiday Name', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'type', label: 'Type', type: 'select', options: [
            { label: 'National', value: 'NATIONAL' }, { label: 'State', value: 'STATE' },
            { label: 'School', value: 'SCHOOL' }, { label: 'Restricted', value: 'RESTRICTED' },
          ]},
          { name: 'isOptional', label: 'Is Optional', type: 'boolean', defaultValue: false },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'house-master',
        label: 'House Master',
        model: 'HouseMaster',
        icon: 'Flag',
        description: 'Manage school houses (for competitions)',
        requiredFields: ['name'],
        searchFields: ['name', 'color'],
        fields: [
          { name: 'name', label: 'House Name', type: 'text', required: true, placeholder: 'e.g., Red House' },
          { name: 'color', label: 'Color', type: 'color' },
          { name: 'motto', label: 'Motto', type: 'text' },
          { name: 'captain', label: 'Captain', type: 'text' },
          { name: 'viceCaptain', label: 'Vice Captain', type: 'text' },
        ],
      },
      {
        key: 'school-timing-master',
        label: 'School Timing Master',
        model: 'SchoolTimingMaster',
        icon: 'Timer',
        description: 'Define school timings',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Timing Set Name', type: 'text', required: true },
          { name: 'assemblyStart', label: 'Assembly Start', type: 'text', placeholder: '07:45' },
          { name: 'assemblyEnd', label: 'Assembly End', type: 'text', placeholder: '08:00' },
          { name: 'firstPeriodStart', label: 'First Period Start', type: 'text', placeholder: '08:00' },
          { name: 'lastPeriodEnd', label: 'Last Period End', type: 'text', placeholder: '14:00' },
          { name: 'lunchStart', label: 'Lunch Start', type: 'text', placeholder: '12:00' },
          { name: 'lunchEnd', label: 'Lunch End', type: 'text', placeholder: '12:30' },
          { name: 'dispersalTime', label: 'Dispersal Time', type: 'text', placeholder: '14:00' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. Academic Masters
  // ─────────────────────────────────────────────
  {
    id: 'academic',
    label: 'Academic Masters',
    icon: 'GraduationCap',
    description: 'Classes, sections, streams, subjects, and curriculum settings',
    models: [
      {
        key: 'stream-master',
        label: 'Stream Master',
        model: 'StreamMaster',
        icon: 'Workflow',
        description: 'Academic streams (Science, Commerce, Arts)',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Stream Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'subject-group-master',
        label: 'Subject Group Master',
        model: 'SubjectGroupMaster',
        icon: 'Layers',
        description: 'Group subjects together',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Group Name', type: 'text', required: true },
          { name: 'classId', label: 'Class (ID)', type: 'text' },
          { name: 'streamId', label: 'Stream (ID)', type: 'text' },
          { name: 'subjects', label: 'Subject IDs (comma-separated)', type: 'text' },
        ],
      },
      {
        key: 'elective-subject-master',
        label: 'Elective Subject Master',
        model: 'ElectiveSubjectMaster',
        icon: 'BookMarked',
        description: 'Manage elective subjects',
        requiredFields: ['subjectId', 'classId'],
        searchFields: ['subjectId'],
        fields: [
          { name: 'subjectId', label: 'Subject (ID)', type: 'text', required: true },
          { name: 'classId', label: 'Class (ID)', type: 'text', required: true },
          { name: 'streamId', label: 'Stream (ID)', type: 'text' },
          { name: 'maxStudents', label: 'Max Students', type: 'number' },
        ],
      },
      {
        key: 'medium-master',
        label: 'Medium Master',
        model: 'MediumMaster',
        icon: 'Languages',
        description: 'Teaching medium (English, Hindi, etc.)',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Medium Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
        ],
      },
      {
        key: 'board-master',
        label: 'Board Master',
        model: 'BoardMaster',
        icon: 'Award',
        description: 'Education boards (CBSE, ICSE, State, IB)',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Board Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'select', required: true, options: [
            { label: 'CBSE', value: 'CBSE' }, { label: 'ICSE', value: 'ICSE' },
            { label: 'State Board', value: 'STATE' }, { label: 'IB', value: 'IB' },
            { label: 'Cambridge', value: 'CAMBRIDGE' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'course-master',
        label: 'Course Master',
        model: 'CourseMaster',
        icon: 'BookOpen',
        description: 'Manage courses / programs',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Course Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'duration', label: 'Duration', type: 'number' },
          { name: 'durationUnit', label: 'Duration Unit', type: 'select', options: [
            { label: 'Years', value: 'YEARS' }, { label: 'Months', value: 'MONTHS' }, { label: 'Semesters', value: 'SEMESTERS' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'syllabus-master',
        label: 'Syllabus Master',
        model: 'SyllabusMaster',
        icon: 'FileText',
        description: 'Define syllabus per class/subject',
        requiredFields: ['name', 'classId', 'subjectId'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Syllabus Title', type: 'text', required: true },
          { name: 'classId', label: 'Class (ID)', type: 'text', required: true },
          { name: 'subjectId', label: 'Subject (ID)', type: 'text', required: true },
          { name: 'boardId', label: 'Board (ID)', type: 'text' },
          { name: 'content', label: 'Content / Topics', type: 'textarea' },
        ],
      },
      {
        key: 'period-master',
        label: 'Period Master',
        model: 'PeriodMaster',
        icon: 'Clock3',
        description: 'Define periods/slots in a day',
        requiredFields: ['name', 'number', 'startTime', 'endTime'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Period Name', type: 'text', required: true, placeholder: 'e.g., Period 1' },
          { name: 'number', label: 'Period Number', type: 'number', required: true },
          { name: 'startTime', label: 'Start Time', type: 'text', required: true, placeholder: '08:00' },
          { name: 'endTime', label: 'End Time', type: 'text', required: true, placeholder: '08:40' },
          { name: 'duration', label: 'Duration (min)', type: 'number' },
          { name: 'type', label: 'Type', type: 'select', options: [
            { label: 'Regular', value: 'REGULAR' }, { label: 'Break', value: 'BREAK' },
            { label: 'Lunch', value: 'LUNCH' }, { label: 'Free', value: 'FREE' },
          ]},
        ],
      },
      {
        key: 'timetable-slot-master',
        label: 'Timetable Slot Master',
        model: 'TimetableSlotMaster',
        icon: 'LayoutGrid',
        description: 'Pre-defined timetable slots',
        requiredFields: ['dayOfWeek', 'periodId'],
        searchFields: ['dayOfWeek'],
        fields: [
          { name: 'dayOfWeek', label: 'Day', type: 'select', required: true, options: [
            { label: 'Monday', value: '1' }, { label: 'Tuesday', value: '2' }, { label: 'Wednesday', value: '3' },
            { label: 'Thursday', value: '4' }, { label: 'Friday', value: '5' }, { label: 'Saturday', value: '6' },
          ]},
          { name: 'periodId', label: 'Period (ID)', type: 'text', required: true },
          { name: 'classId', label: 'Class (ID)', type: 'text' },
          { name: 'sectionId', label: 'Section (ID)', type: 'text' },
          { name: 'subjectId', label: 'Subject (ID)', type: 'text' },
          { name: 'teacherId', label: 'Teacher (ID)', type: 'text' },
          { name: 'roomId', label: 'Room (ID)', type: 'text' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. Student Masters
  // ─────────────────────────────────────────────
  {
    id: 'student',
    label: 'Student Masters',
    icon: 'Users',
    description: 'Admission types, categories, religions, and student-related configurations',
    models: [
      {
        key: 'admission-type-master',
        label: 'Admission Type Master',
        model: 'AdmissionTypeMaster',
        icon: 'UserPlus',
        description: 'Types of admission (New, Transfer, etc.)',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'category-master',
        label: 'Category Master',
        model: 'CategoryMaster',
        icon: 'Tag',
        description: 'Student categories (GEN, OBC, SC, ST, EWS)',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'select', options: [
            { label: 'General', value: 'GEN' }, { label: 'OBC', value: 'OBC' },
            { label: 'SC', value: 'SC' }, { label: 'ST', value: 'ST' }, { label: 'EWS', value: 'EWS' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'religion-master',
        label: 'Religion Master',
        model: 'ReligionMaster',
        icon: 'Heart',
        description: 'Religions list',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Religion Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
        ],
      },
      {
        key: 'caste-master',
        label: 'Caste Master',
        model: 'CasteMaster',
        icon: 'List',
        description: 'Caste list linked to categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Caste Name', type: 'text', required: true },
          { name: 'categoryId', label: 'Category (ID)', type: 'text' },
        ],
      },
      {
        key: 'nationality-master',
        label: 'Nationality Master',
        model: 'NationalityMaster',
        icon: 'Globe',
        description: 'Nationalities list',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Nationality', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
        ],
      },
      {
        key: 'blood-group-master',
        label: 'Blood Group Master',
        model: 'BloodGroupMaster',
        icon: 'Droplet',
        description: 'Blood groups',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Blood Group', type: 'select', required: true, options: [
            { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
            { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
            { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
            { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
          ]},
        ],
      },
      {
        key: 'mother-tongue-master',
        label: 'Mother Tongue Master',
        model: 'MotherTongueMaster',
        icon: 'MessageCircle',
        description: 'Mother tongue languages',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Language', type: 'text', required: true },
        ],
      },
      {
        key: 'student-status-master',
        label: 'Student Status Master',
        model: 'StudentStatusMaster',
        icon: 'Activity',
        description: 'Student status values',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Status Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'select', required: true, options: [
            { label: 'Active', value: 'ACTIVE' }, { label: 'Left', value: 'LEFT' },
            { label: 'TC Issued', value: 'TC' }, { label: 'Pass Out', value: 'PASSOUT' },
            { label: 'Suspended', value: 'SUSPENDED' },
          ]},
          { name: 'color', label: 'Color', type: 'color' },
        ],
      },
      {
        key: 'sibling-relation-master',
        label: 'Sibling Relation Master',
        model: 'SiblingRelationMaster',
        icon: 'UsersRound',
        description: 'Sibling relationship types',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Relation', type: 'select', required: true, options: [
            { label: 'Brother', value: 'BROTHER' }, { label: 'Sister', value: 'SISTER' }, { label: 'Twin', value: 'TWIN' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. Staff Masters
  // ─────────────────────────────────────────────
  {
    id: 'staff',
    label: 'Staff Masters',
    icon: 'UserCog',
    description: 'Departments, designations, employment types, and staff configurations',
    models: [
      {
        key: 'department-master',
        label: 'Department Master',
        model: 'DepartmentMaster',
        icon: 'Building',
        description: 'School departments',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Department Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'hodId', label: 'HOD (User ID)', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'designation-master',
        label: 'Designation Master',
        model: 'DesignationMaster',
        icon: 'BadgeCheck',
        description: 'Staff designations',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Designation', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'level', label: 'Level', type: 'number' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'employment-type-master',
        label: 'Employment Type Master',
        model: 'EmploymentTypeMaster',
        icon: 'Briefcase',
        description: 'Types of employment',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Employment Type', type: 'select', required: true, options: [
            { label: 'Permanent', value: 'PERMANENT' }, { label: 'Contract', value: 'CONTRACT' },
            { label: 'Temporary', value: 'TEMPORARY' }, { label: 'Ad-hoc', value: 'ADHOC' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'qualification-master',
        label: 'Qualification Master',
        model: 'QualificationMaster',
        icon: 'GraduationCap',
        description: 'Educational qualifications',
        requiredFields: ['name'],
        searchFields: ['name', 'level'],
        fields: [
          { name: 'name', label: 'Qualification', type: 'text', required: true },
          { name: 'level', label: 'Level', type: 'select', options: [
            { label: 'PhD', value: 'PHD' }, { label: 'Masters', value: 'MASTERS' },
            { label: 'Bachelors', value: 'BACHELORS' }, { label: 'Diploma', value: 'DIPLOMA' },
            { label: '12th', value: '12TH' }, { label: '10th', value: '10TH' },
          ]},
        ],
      },
      {
        key: 'leave-type-master',
        label: 'Leave Type Master',
        model: 'LeaveTypeMaster',
        icon: 'CalendarOff',
        description: 'Types of leave',
        requiredFields: ['name', 'code', 'maxDays'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Leave Type', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true },
          { name: 'maxDays', label: 'Max Days / Year', type: 'number', required: true },
          { name: 'carryForward', label: 'Carry Forward', type: 'boolean', defaultValue: false },
          { name: 'encashable', label: 'Encashable', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'staff-category-master',
        label: 'Staff Category Master',
        model: 'StaffCategoryMaster',
        icon: 'Users2',
        description: 'Staff categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Category', type: 'select', required: true, options: [
            { label: 'Teaching', value: 'TEACHING' }, { label: 'Non-Teaching', value: 'NON_TEACHING' },
            { label: 'Admin', value: 'ADMIN' }, { label: 'Support', value: 'SUPPORT' },
          ]},
        ],
      },
      {
        key: 'salary-grade-master',
        label: 'Salary Grade Master',
        model: 'SalaryGradeMaster',
        icon: 'IndianRupee',
        description: 'Salary grades and pay scales',
        requiredFields: ['name', 'minPay', 'maxPay'],
        searchFields: ['name', 'level'],
        fields: [
          { name: 'name', label: 'Grade Name', type: 'text', required: true },
          { name: 'minPay', label: 'Min Pay (₹)', type: 'number', required: true },
          { name: 'maxPay', label: 'Max Pay (₹)', type: 'number', required: true },
          { name: 'increment', label: 'Annual Increment (₹)', type: 'number' },
          { name: 'level', label: 'Level', type: 'number' },
        ],
      },
      {
        key: 'bank-master',
        label: 'Bank Master',
        model: 'BankMaster',
        icon: 'Landmark',
        description: 'Banks for salary disbursement',
        requiredFields: ['name'],
        searchFields: ['name', 'code', 'branch'],
        fields: [
          { name: 'name', label: 'Bank Name', type: 'text', required: true },
          { name: 'code', label: 'IFSC Prefix', type: 'text' },
          { name: 'branch', label: 'Branch', type: 'text' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. Fee Masters
  // ─────────────────────────────────────────────
  {
    id: 'fee',
    label: 'Fee Masters',
    icon: 'IndianRupee',
    description: 'Fee heads, groups, types, concessions, scholarships, and payment configurations',
    models: [
      {
        key: 'fee-group-master',
        label: 'Fee Group Master',
        model: 'FeeGroupMaster',
        icon: 'FolderOpen',
        description: 'Group fee heads together',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Group Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'classes', label: 'Applicable Classes (comma-separated IDs)', type: 'text' },
        ],
      },
      {
        key: 'fee-type-master',
        label: 'Fee Type Master',
        model: 'FeeTypeMaster',
        icon: 'Receipt',
        description: 'Types of fees',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Fee Type', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'isRefundable', label: 'Refundable', type: 'boolean', defaultValue: false },
          { name: 'isMandatory', label: 'Mandatory', type: 'boolean', defaultValue: true },
        ],
      },
      {
        key: 'concession-master',
        label: 'Concession Master',
        model: 'ConcessionMaster',
        icon: 'Percent',
        description: 'Fee concessions/discounts',
        requiredFields: ['name', 'type', 'value'],
        searchFields: ['name', 'reason'],
        fields: [
          { name: 'name', label: 'Concession Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Percentage', value: 'PERCENTAGE' }, { label: 'Fixed Amount', value: 'AMOUNT' },
          ]},
          { name: 'value', label: 'Value', type: 'number', required: true },
          { name: 'reason', label: 'Reason', type: 'textarea' },
          { name: 'criteria', label: 'Criteria', type: 'textarea' },
        ],
      },
      {
        key: 'scholarship-master',
        label: 'Scholarship Master',
        model: 'ScholarshipMaster',
        icon: 'Award',
        description: 'Scholarship schemes',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'provider'],
        fields: [
          { name: 'name', label: 'Scholarship Name', type: 'text', required: true },
          { name: 'provider', label: 'Provider', type: 'text' },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Merit', value: 'MERIT' }, { label: 'Need-based', value: 'NEED' },
            { label: 'Sports', value: 'SPORTS' }, { label: 'Minority', value: 'MINORITY' },
          ]},
          { name: 'amount', label: 'Amount (₹)', type: 'number' },
          { name: 'percentage', label: 'Percentage (%)', type: 'number' },
          { name: 'criteria', label: 'Eligibility Criteria', type: 'textarea' },
          { name: 'maxStudents', label: 'Max Beneficiaries', type: 'number' },
        ],
      },
      {
        key: 'payment-mode-master',
        label: 'Payment Mode Master',
        model: 'PaymentModeMaster',
        icon: 'Wallet',
        description: 'Payment methods accepted',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Payment Mode', type: 'select', required: true, options: [
            { label: 'Cash', value: 'CASH' }, { label: 'Cheque', value: 'CHEQUE' },
            { label: 'Online', value: 'ONLINE' }, { label: 'UPI', value: 'UPI' },
            { label: 'Card', value: 'CARD' }, { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
          ]},
          { name: 'code', label: 'Code', type: 'text' },
        ],
      },
      {
        key: 'receipt-series-master',
        label: 'Receipt Series Master',
        model: 'ReceiptSeriesMaster',
        icon: 'Hash',
        description: 'Receipt number series configuration',
        requiredFields: ['prefix', 'startNumber'],
        searchFields: ['prefix'],
        fields: [
          { name: 'prefix', label: 'Prefix', type: 'text', required: true, placeholder: 'REC-' },
          { name: 'startNumber', label: 'Start Number', type: 'number', required: true, defaultValue: 1 },
          { name: 'currentNumber', label: 'Current Number', type: 'number' },
          { name: 'suffix', label: 'Suffix', type: 'text' },
          { name: 'format', label: 'Format Example', type: 'text', placeholder: 'REC-0001' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. Examination Masters
  // ─────────────────────────────────────────────
  {
    id: 'examination',
    label: 'Examination Masters',
    icon: 'ClipboardList',
    description: 'Exam types, terms, grading systems, and assessment configurations',
    models: [
      {
        key: 'exam-type-master',
        label: 'Exam Type Master',
        model: 'ExamTypeMaster',
        icon: 'FileQuestion',
        description: 'Types of examinations',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Exam Type', type: 'select', required: true, options: [
            { label: 'Unit Test', value: 'UNIT_TEST' }, { label: 'Mid Term', value: 'MID_TERM' },
            { label: 'Final', value: 'FINAL' }, { label: 'Practical', value: 'PRACTICAL' },
            { label: 'Oral', value: 'ORAL' },
          ]},
          { name: 'weightage', label: 'Weightage (%)', type: 'number' },
        ],
      },
      {
        key: 'exam-term-master',
        label: 'Exam Term Master',
        model: 'ExamTermMaster',
        icon: 'CalendarRange',
        description: 'Exam terms within academic year',
        requiredFields: ['name', 'startDate', 'endDate'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Term Name', type: 'text', required: true, placeholder: 'e.g., Term 1' },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'academicYearId', label: 'Academic Year (ID)', type: 'text' },
        ],
      },
      {
        key: 'result-type-master',
        label: 'Result Type Master',
        model: 'ResultTypeMaster',
        icon: 'BarChart',
        description: 'Result display types',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Result Type', type: 'select', required: true, options: [
            { label: 'Marks', value: 'MARKS' }, { label: 'Grade', value: 'GRADE' }, { label: 'CGPA', value: 'CGPA' },
          ]},
          { name: 'formula', label: 'Formula', type: 'text' },
        ],
      },
      {
        key: 'marking-scheme-master',
        label: 'Marking Scheme Master',
        model: 'MarkingSchemeMaster',
        icon: 'PenLine',
        description: 'Marking schemes (max marks, passing marks)',
        requiredFields: ['name', 'maxMarks', 'passingMarks'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Scheme Name', type: 'text', required: true },
          { name: 'maxMarks', label: 'Maximum Marks', type: 'number', required: true },
          { name: 'passingMarks', label: 'Passing Marks', type: 'number', required: true },
          { name: 'practicalMarks', label: 'Practical Marks', type: 'number' },
          { name: 'internalMarks', label: 'Internal Marks', type: 'number' },
        ],
      },
      {
        key: 'assessment-master',
        label: 'Assessment Master',
        model: 'AssessmentMaster',
        icon: 'CheckSquare',
        description: 'Assessment types',
        requiredFields: ['name', 'type', 'maxScore'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Assessment Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Written', value: 'WRITTEN' }, { label: 'Oral', value: 'ORAL' },
            { label: 'Practical', value: 'PRACTICAL' }, { label: 'Project', value: 'PROJECT' },
            { label: 'Assignment', value: 'ASSIGNMENT' },
          ]},
          { name: 'maxScore', label: 'Max Score', type: 'number', required: true },
          { name: 'weightage', label: 'Weightage (%)', type: 'number' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. Attendance Masters
  // ─────────────────────────────────────────────
  {
    id: 'attendance',
    label: 'Attendance Masters',
    icon: 'CalendarCheck',
    description: 'Attendance status types, late fines, leave reasons, and shift configurations',
    models: [
      {
        key: 'attendance-status-master',
        label: 'Attendance Status Master',
        model: 'AttendanceStatusMaster',
        icon: 'CheckCircle',
        description: 'Attendance status values',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Status Name', type: 'select', required: true, options: [
            { label: 'Present', value: 'PRESENT' }, { label: 'Absent', value: 'ABSENT' },
            { label: 'Late', value: 'LATE' }, { label: 'Half Day', value: 'HALF_DAY' },
            { label: 'Leave', value: 'LEAVE' }, { label: 'Holiday', value: 'HOLIDAY' },
          ]},
          { name: 'code', label: 'Short Code', type: 'text', required: true, placeholder: 'P/A/L/HD' },
          { name: 'color', label: 'Color', type: 'color' },
          { name: 'countAsPresent', label: 'Count as Present', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'late-fine-master',
        label: 'Late Fine Master',
        model: 'LateFineMaster',
        icon: 'AlertTriangle',
        description: 'Late arrival fine configuration',
        requiredFields: ['afterMinutes', 'fineAmount'],
        searchFields: ['afterMinutes'],
        fields: [
          { name: 'afterMinutes', label: 'After Minutes Late', type: 'number', required: true },
          { name: 'fineAmount', label: 'Fine Amount (₹)', type: 'number', required: true },
          { name: 'frequency', label: 'Frequency', type: 'select', options: [
            { label: 'Daily', value: 'DAILY' }, { label: 'Weekly', value: 'WEEKLY' }, { label: 'Monthly', value: 'MONTHLY' },
          ]},
        ],
      },
      {
        key: 'leave-reason-master',
        label: 'Leave Reason Master',
        model: 'LeaveReasonMaster',
        icon: 'FileWarning',
        description: 'Predefined leave reasons',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Reason', type: 'text', required: true },
          { name: 'requiresDocument', label: 'Requires Document', type: 'boolean', defaultValue: false },
          { name: 'maxDays', label: 'Max Days Allowed', type: 'number' },
        ],
      },
      {
        key: 'attendance-shift-master',
        label: 'Attendance Shift Master',
        model: 'AttendanceShiftMaster',
        icon: 'Timer',
        description: 'Attendance shifts with grace time',
        requiredFields: ['name', 'startTime', 'endTime'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Shift Name', type: 'text', required: true },
          { name: 'startTime', label: 'Start Time', type: 'text', required: true },
          { name: 'endTime', label: 'End Time', type: 'text', required: true },
          { name: 'graceMinutes', label: 'Grace Minutes', type: 'number', defaultValue: 10 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 8. Library Masters
  // ─────────────────────────────────────────────
  {
    id: 'library',
    label: 'Library Masters',
    icon: 'BookOpen',
    description: 'Publishers, authors, languages, rack/shelf management',
    models: [
      {
        key: 'publisher-master',
        label: 'Publisher Master',
        model: 'PublisherMaster',
        icon: 'Printer',
        description: 'Book publishers',
        requiredFields: ['name'],
        searchFields: ['name', 'email'],
        fields: [
          { name: 'name', label: 'Publisher Name', type: 'text', required: true },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'phone', label: 'Phone', type: 'phone' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'website', label: 'Website', type: 'url' },
        ],
      },
      {
        key: 'author-master',
        label: 'Author Master',
        model: 'AuthorMaster',
        icon: 'Pen',
        description: 'Book authors',
        requiredFields: ['name'],
        searchFields: ['name', 'nationality'],
        fields: [
          { name: 'name', label: 'Author Name', type: 'text', required: true },
          { name: 'nationality', label: 'Nationality', type: 'text' },
          { name: 'biography', label: 'Biography', type: 'textarea' },
        ],
      },
      {
        key: 'language-master',
        label: 'Language Master',
        model: 'LanguageMaster',
        icon: 'Languages',
        description: 'Book languages',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Language', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', placeholder: 'en, hi, mr' },
        ],
      },
      {
        key: 'rack-master',
        label: 'Rack Master',
        model: 'RackMaster',
        icon: 'Server',
        description: 'Library racks',
        requiredFields: ['name'],
        searchFields: ['name', 'location'],
        fields: [
          { name: 'name', label: 'Rack Name/Number', type: 'text', required: true },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'capacity', label: 'Capacity (books)', type: 'number' },
        ],
      },
      {
        key: 'shelf-master',
        label: 'Shelf Master',
        model: 'ShelfMaster',
        icon: 'Rows3',
        description: 'Shelves within racks',
        requiredFields: ['name', 'rackId'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Shelf Name', type: 'text', required: true },
          { name: 'rackId', label: 'Rack (ID)', type: 'text', required: true },
          { name: 'level', label: 'Level Number', type: 'number' },
        ],
      },
      {
        key: 'book-condition-master',
        label: 'Book Condition Master',
        model: 'BookConditionMaster',
        icon: 'ThumbsUp',
        description: 'Condition of books',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Condition', type: 'select', required: true, options: [
            { label: 'New', value: 'NEW' }, { label: 'Good', value: 'GOOD' },
            { label: 'Fair', value: 'FAIR' }, { label: 'Damaged', value: 'DAMAGED' }, { label: 'Lost', value: 'LOST' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 9. Hostel Masters
  // ─────────────────────────────────────────────
  {
    id: 'hostel',
    label: 'Hostel Masters',
    icon: 'BedDouble',
    description: 'Hostel blocks, floors, rooms, beds, and mess management',
    models: [
      {
        key: 'block-master',
        label: 'Block Master',
        model: 'BlockMaster',
        icon: 'Building2',
        description: 'Hostel blocks/wings',
        requiredFields: ['name', 'hostelId'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Block Name', type: 'text', required: true },
          { name: 'hostelId', label: 'Hostel (ID)', type: 'text', required: true },
          { name: 'floors', label: 'Number of Floors', type: 'number' },
        ],
      },
      {
        key: 'floor-master',
        label: 'Floor Master',
        model: 'FloorMaster',
        icon: 'Layers',
        description: 'Floors within blocks',
        requiredFields: ['name', 'blockId', 'number'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Floor Name', type: 'text', required: true },
          { name: 'blockId', label: 'Block (ID)', type: 'text', required: true },
          { name: 'number', label: 'Floor Number', type: 'number', required: true },
          { name: 'roomCount', label: 'Room Count', type: 'number' },
        ],
      },
      {
        key: 'bed-master',
        label: 'Bed Master',
        model: 'BedMaster',
        icon: 'BedSingle',
        description: 'Beds within rooms',
        requiredFields: ['roomId', 'bedNumber'],
        searchFields: ['bedNumber'],
        fields: [
          { name: 'roomId', label: 'Room (ID)', type: 'text', required: true },
          { name: 'bedNumber', label: 'Bed Number', type: 'text', required: true },
          { name: 'type', label: 'Bed Type', type: 'select', options: [
            { label: 'Single', value: 'SINGLE' }, { label: 'Double', value: 'DOUBLE' }, { label: 'Bunk', value: 'BUNK' },
          ]},
          { name: 'status', label: 'Status', type: 'select', options: [
            { label: 'Available', value: 'AVAILABLE' }, { label: 'Occupied', value: 'OCCUPIED' }, { label: 'Maintenance', value: 'MAINTENANCE' },
          ]},
        ],
      },
      {
        key: 'hostel-type-master',
        label: 'Hostel Type Master',
        model: 'HostelTypeMaster',
        icon: 'Home',
        description: 'Types of hostels',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Hostel Type', type: 'select', required: true, options: [
            { label: 'Boys', value: 'BOYS' }, { label: 'Girls', value: 'GIRLS' }, { label: 'Staff', value: 'STAFF' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 10. Transport Masters
  // ─────────────────────────────────────────────
  {
    id: 'transport',
    label: 'Transport Masters',
    icon: 'Bus',
    description: 'Vehicles, drivers, conductors, fuel types, and GPS devices',
    models: [
      {
        key: 'driver-master',
        label: 'Driver Master',
        model: 'DriverMaster',
        icon: 'User',
        description: 'Vehicle drivers',
        requiredFields: ['name', 'phone', 'licenseNumber'],
        searchFields: ['name', 'phone', 'licenseNumber'],
        fields: [
          { name: 'name', label: 'Driver Name', type: 'text', required: true },
          { name: 'phone', label: 'Phone', type: 'phone', required: true },
          { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
          { name: 'licenseExpiry', label: 'License Expiry', type: 'date' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'experience', label: 'Experience (years)', type: 'number' },
        ],
      },
      {
        key: 'conductor-master',
        label: 'Conductor Master',
        model: 'ConductorMaster',
        icon: 'UserCheck',
        description: 'Vehicle conductors',
        requiredFields: ['name', 'phone'],
        searchFields: ['name', 'phone'],
        fields: [
          { name: 'name', label: 'Conductor Name', type: 'text', required: true },
          { name: 'phone', label: 'Phone', type: 'phone', required: true },
          { name: 'address', label: 'Address', type: 'textarea' },
        ],
      },
      {
        key: 'fuel-type-master',
        label: 'Fuel Type Master',
        model: 'FuelTypeMaster',
        icon: 'Fuel',
        description: 'Vehicle fuel types',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Fuel Type', type: 'select', required: true, options: [
            { label: 'Diesel', value: 'DIESEL' }, { label: 'Petrol', value: 'PETROL' },
            { label: 'CNG', value: 'CNG' }, { label: 'Electric', value: 'ELECTRIC' },
          ]},
        ],
      },
      {
        key: 'gps-device-master',
        label: 'GPS Device Master',
        model: 'GPSDeviceMaster',
        icon: 'MapPin',
        description: 'GPS tracking devices',
        requiredFields: ['deviceId'],
        searchFields: ['deviceId', 'provider'],
        fields: [
          { name: 'deviceId', label: 'Device ID', type: 'text', required: true },
          { name: 'vehicleId', label: 'Vehicle (ID)', type: 'text' },
          { name: 'provider', label: 'Provider', type: 'text' },
          { name: 'simNumber', label: 'SIM Number', type: 'text' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 11. Inventory Masters
  // ─────────────────────────────────────────────
  {
    id: 'inventory',
    label: 'Inventory Masters',
    icon: 'Package',
    description: 'Item categories, groups, units, brands, suppliers, and warehouse configurations',
    models: [
      {
        key: 'item-category-master',
        label: 'Item Category Master',
        model: 'ItemCategoryMaster',
        icon: 'Folder',
        description: 'Item categories hierarchy',
        requiredFields: ['name'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text' },
          { name: 'parentCategoryId', label: 'Parent Category (ID)', type: 'text' },
        ],
      },
      {
        key: 'item-group-master',
        label: 'Item Group Master',
        model: 'ItemGroupMaster',
        icon: 'LayoutList',
        description: 'Item groups within categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Group Name', type: 'text', required: true },
          { name: 'categoryId', label: 'Category (ID)', type: 'text' },
        ],
      },
      {
        key: 'unit-master',
        label: 'Unit Master',
        model: 'UnitMaster',
        icon: 'Ruler',
        description: 'Units of measurement',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Unit Name', type: 'select', required: true, options: [
            { label: 'Pieces', value: 'PCS' }, { label: 'Kilograms', value: 'KG' },
            { label: 'Litres', value: 'LTR' }, { label: 'Box', value: 'BOX' },
            { label: 'Set', value: 'SET' }, { label: 'Pack', value: 'PACK' },
          ]},
          { name: 'code', label: 'Code', type: 'text', required: true },
        ],
      },
      {
        key: 'brand-master',
        label: 'Brand Master',
        model: 'BrandMaster',
        icon: 'Star',
        description: 'Item brands',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Brand Name', type: 'text', required: true },
        ],
      },
      {
        key: 'supplier-master',
        label: 'Supplier Master',
        model: 'SupplierMaster',
        icon: 'Truck',
        description: 'Material suppliers/vendors',
        requiredFields: ['name', 'phone'],
        searchFields: ['name', 'contactPerson', 'phone'],
        fields: [
          { name: 'name', label: 'Supplier Name', type: 'text', required: true },
          { name: 'contactPerson', label: 'Contact Person', type: 'text' },
          { name: 'phone', label: 'Phone', type: 'phone', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'gstNumber', label: 'GST Number', type: 'text' },
          { name: 'panNumber', label: 'PAN Number', type: 'text' },
        ],
      },
      {
        key: 'warehouse-master',
        label: 'Warehouse Master',
        model: 'WarehouseMaster',
        icon: 'Warehouse',
        description: 'Storage warehouses',
        requiredFields: ['name'],
        searchFields: ['name', 'address'],
        fields: [
          { name: 'name', label: 'Warehouse Name', type: 'text', required: true },
          { name: 'address', label: 'Address', type: 'textarea' },
          { name: 'capacity', label: 'Capacity', type: 'number' },
          { name: 'managerId', label: 'Manager (User ID)', type: 'text' },
        ],
      },
      {
        key: 'store-master',
        label: 'Store Master',
        model: 'StoreMaster',
        icon: 'Store',
        description: 'Material stores',
        requiredFields: ['name'],
        searchFields: ['name', 'location'],
        fields: [
          { name: 'name', label: 'Store Name', type: 'text', required: true },
          { name: 'warehouseId', label: 'Warehouse (ID)', type: 'text' },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'managerId', label: 'Manager (User ID)', type: 'text' },
        ],
      },
      {
        key: 'stock-type-master',
        label: 'Stock Type Master',
        model: 'StockTypeMaster',
        icon: 'Boxes',
        description: 'Types of stock items',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Stock Type', type: 'select', required: true, options: [
            { label: 'Consumable', value: 'CONSUMABLE' }, { label: 'Non-Consumable', value: 'NON_CONSUMABLE' },
            { label: 'Returnable', value: 'RETURNABLE' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 12. HR Masters
  // ─────────────────────────────────────────────
  {
    id: 'hr',
    label: 'HR Masters',
    icon: 'Briefcase',
    description: 'Payroll heads, salary components, PF/ESI, tax slabs',
    models: [
      {
        key: 'payroll-head-master',
        label: 'Payroll Head Master',
        model: 'PayrollHeadMaster',
        icon: 'FileSpreadsheet',
        description: 'Payroll earning/deduction heads',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Head Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Earning', value: 'EARNING' }, { label: 'Deduction', value: 'DEDUCTION' },
          ]},
          { name: 'isFixed', label: 'Is Fixed', type: 'boolean', defaultValue: true },
          { name: 'formula', label: 'Formula (if variable)', type: 'text' },
        ],
      },
      {
        key: 'salary-component-master',
        label: 'Salary Component Master',
        model: 'SalaryComponentMaster',
        icon: 'Calculator',
        description: 'Salary components (Basic, HRA, DA, etc.)',
        requiredFields: ['name', 'type', 'calculationType'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Component Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Basic', value: 'BASIC' }, { label: 'HRA', value: 'HRA' },
            { label: 'DA', value: 'DA' }, { label: 'TA', value: 'TA' },
            { label: 'Medical', value: 'MEDICAL' }, { label: 'PF Deduction', value: 'PF_DEDUCTION' },
            { label: 'Tax', value: 'TAX' }, { label: 'Other', value: 'OTHER' },
          ]},
          { name: 'calculationType', label: 'Calculation', type: 'select', required: true, options: [
            { label: 'Fixed Amount', value: 'FIXED' }, { label: 'Percentage', value: 'PERCENTAGE' },
          ]},
          { name: 'baseComponent', label: 'Base Component (if %)', type: 'text' },
          { name: 'percentage', label: 'Percentage', type: 'number' },
        ],
      },
      {
        key: 'pf-master',
        label: 'PF Master',
        model: 'PFMaster',
        icon: 'Shield',
        description: 'Provident Fund configuration',
        requiredFields: ['employeeContribution', 'employerContribution'],
        searchFields: [],
        fields: [
          { name: 'employeeContribution', label: 'Employee Contribution (%)', type: 'number', required: true },
          { name: 'employerContribution', label: 'Employer Contribution (%)', type: 'number', required: true },
          { name: 'adminCharges', label: 'Admin Charges (%)', type: 'number' },
          { name: 'ceiling', label: 'Salary Ceiling (₹)', type: 'number' },
        ],
      },
      {
        key: 'esi-master',
        label: 'ESI Master',
        model: 'ESIMaster',
        icon: 'HeartPulse',
        description: 'ESI configuration',
        requiredFields: ['employeeContribution', 'employerContribution'],
        searchFields: [],
        fields: [
          { name: 'employeeContribution', label: 'Employee Contribution (%)', type: 'number', required: true },
          { name: 'employerContribution', label: 'Employer Contribution (%)', type: 'number', required: true },
          { name: 'ceiling', label: 'Salary Ceiling (₹)', type: 'number' },
        ],
      },
      {
        key: 'tax-slab-master',
        label: 'Tax Slab Master',
        model: 'TaxSlabMaster',
        icon: 'Receipt',
        description: 'Income tax slabs',
        requiredFields: ['fromAmount', 'toAmount', 'percentage', 'regime', 'financialYear'],
        searchFields: ['financialYear', 'regime'],
        fields: [
          { name: 'fromAmount', label: 'From Amount (₹)', type: 'number', required: true },
          { name: 'toAmount', label: 'To Amount (₹)', type: 'number', required: true },
          { name: 'percentage', label: 'Tax %', type: 'number', required: true },
          { name: 'surcharge', label: 'Surcharge %', type: 'number' },
          { name: 'cess', label: 'Cess %', type: 'number' },
          { name: 'regime', label: 'Tax Regime', type: 'select', required: true, options: [
            { label: 'Old Regime', value: 'OLD' }, { label: 'New Regime', value: 'NEW' },
          ]},
          { name: 'financialYear', label: 'Financial Year', type: 'text', required: true, placeholder: '2024-25' },
        ],
      },
      {
        key: 'increment-type-master',
        label: 'Increment Type Master',
        model: 'IncrementTypeMaster',
        icon: 'TrendingUp',
        description: 'Types of salary increments',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Increment Type', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Annual', value: 'ANNUAL' }, { label: 'Promotion', value: 'PROMOTION' }, { label: 'Special', value: 'SPECIAL' },
          ]},
          { name: 'percentage', label: 'Default %', type: 'number' },
          { name: 'amount', label: 'Default Amount (₹)', type: 'number' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 13. Communication Masters
  // ─────────────────────────────────────────────
  {
    id: 'communication',
    label: 'Communication Masters',
    icon: 'MessageSquare',
    description: 'SMS, email, WhatsApp, and notification templates',
    models: [
      {
        key: 'sms-template-master',
        label: 'SMS Template Master',
        model: 'SMSTemplateMaster',
        icon: 'Smartphone',
        description: 'SMS templates with DLT IDs',
        requiredFields: ['name', 'content'],
        searchFields: ['name', 'category'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'content', label: 'Message Content', type: 'textarea', required: true },
          { name: 'variables', label: 'Variables (comma-separated)', type: 'text', placeholder: '{name},{class},{date}' },
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'dltTemplateId', label: 'DLT Template ID', type: 'text' },
        ],
      },
      {
        key: 'email-template-master',
        label: 'Email Template Master',
        model: 'EmailTemplateMaster',
        icon: 'Mail',
        description: 'Email templates',
        requiredFields: ['name', 'subject', 'body'],
        searchFields: ['name', 'subject', 'category'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'subject', label: 'Subject', type: 'text', required: true },
          { name: 'body', label: 'Body (HTML)', type: 'textarea', required: true },
          { name: 'variables', label: 'Variables (comma-separated)', type: 'text' },
          { name: 'category', label: 'Category', type: 'text' },
        ],
      },
      {
        key: 'whatsapp-template-master',
        label: 'WhatsApp Template Master',
        model: 'WhatsAppTemplateMaster',
        icon: 'MessageCircle',
        description: 'WhatsApp message templates',
        requiredFields: ['name', 'content'],
        searchFields: ['name', 'category'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'content', label: 'Message Content', type: 'textarea', required: true },
          { name: 'variables', label: 'Variables (comma-separated)', type: 'text' },
          { name: 'category', label: 'Category', type: 'text' },
          { name: 'mediaType', label: 'Media Type', type: 'select', options: [
            { label: 'None', value: '' }, { label: 'Image', value: 'IMAGE' },
            { label: 'Document', value: 'DOCUMENT' }, { label: 'Video', value: 'VIDEO' },
          ]},
        ],
      },
      {
        key: 'notification-template-master',
        label: 'Notification Template Master',
        model: 'NotificationTemplateMaster',
        icon: 'Bell',
        description: 'Push/in-app notification templates',
        requiredFields: ['name', 'title', 'body', 'type'],
        searchFields: ['name', 'title'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'title', label: 'Notification Title', type: 'text', required: true },
          { name: 'body', label: 'Body', type: 'textarea', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Push Notification', value: 'PUSH' }, { label: 'In-App', value: 'IN_APP' },
          ]},
          { name: 'icon', label: 'Icon', type: 'text' },
          { name: 'action', label: 'Action URL', type: 'text' },
        ],
      },
      {
        key: 'notice-category-master',
        label: 'Notice Category Master',
        model: 'NoticeCategoryMaster',
        icon: 'FileText',
        description: 'Notice board categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          { name: 'color', label: 'Color', type: 'color' },
          { name: 'icon', label: 'Icon Name', type: 'text' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 14. Certificate Masters
  // ─────────────────────────────────────────────
  {
    id: 'certificate',
    label: 'Certificate Masters',
    icon: 'Award',
    description: 'Certificate and ID card templates',
    models: [
      {
        key: 'certificate-template-master',
        label: 'Certificate Template Master',
        model: 'CertificateTemplateMaster',
        icon: 'FileText',
        description: 'Certificate design templates',
        requiredFields: ['name', 'type', 'content'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Transfer Certificate', value: 'TC' }, { label: 'Character Certificate', value: 'CC' },
            { label: 'Migration', value: 'MIGRATION' }, { label: 'Bonafide', value: 'BONAFIDE' },
            { label: 'Custom', value: 'CUSTOM' },
          ]},
          { name: 'content', label: 'Template Content (HTML)', type: 'textarea', required: true },
          { name: 'headerHtml', label: 'Header HTML', type: 'textarea' },
          { name: 'footerHtml', label: 'Footer HTML', type: 'textarea' },
          { name: 'variables', label: 'Variables (comma-separated)', type: 'text' },
          { name: 'paperSize', label: 'Paper Size', type: 'select', options: [
            { label: 'A4', value: 'A4' }, { label: 'Letter', value: 'LETTER' }, { label: 'Legal', value: 'LEGAL' },
          ]},
          { name: 'orientation', label: 'Orientation', type: 'select', options: [
            { label: 'Portrait', value: 'PORTRAIT' }, { label: 'Landscape', value: 'LANDSCAPE' },
          ]},
        ],
      },
      {
        key: 'id-card-template-master',
        label: 'ID Card Template Master',
        model: 'IDCardTemplateMaster',
        icon: 'IdCard',
        description: 'ID card design templates',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Template Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Student', value: 'STUDENT' }, { label: 'Staff', value: 'STAFF' }, { label: 'Visitor', value: 'VISITOR' },
          ]},
          { name: 'frontDesign', label: 'Front Design (HTML/JSON)', type: 'textarea' },
          { name: 'backDesign', label: 'Back Design (HTML/JSON)', type: 'textarea' },
          { name: 'size', label: 'Card Size', type: 'select', options: [
            { label: 'Standard (CR80)', value: 'CR80' }, { label: 'Custom', value: 'CUSTOM' },
          ]},
          { name: 'orientation', label: 'Orientation', type: 'select', options: [
            { label: 'Portrait', value: 'PORTRAIT' }, { label: 'Landscape', value: 'LANDSCAPE' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 15. User & Security Masters
  // ─────────────────────────────────────────────
  {
    id: 'security',
    label: 'User & Security Masters',
    icon: 'Shield',
    description: 'Roles, permissions, user types, modules, menus',
    models: [
      {
        key: 'role-master',
        label: 'Role Master',
        model: 'RoleMaster',
        icon: 'ShieldCheck',
        description: 'User roles',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Role Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true },
          { name: 'level', label: 'Level', type: 'number' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'isSystem', label: 'System Role (non-deletable)', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'permission-master',
        label: 'Permission Master',
        model: 'PermissionMaster',
        icon: 'Key',
        description: 'Granular permissions',
        requiredFields: ['moduleId', 'action', 'name', 'code'],
        searchFields: ['name', 'code', 'action'],
        fields: [
          { name: 'moduleId', label: 'Module (ID)', type: 'text', required: true },
          { name: 'action', label: 'Action', type: 'select', required: true, options: [
            { label: 'View', value: 'VIEW' }, { label: 'Create', value: 'CREATE' },
            { label: 'Edit', value: 'EDIT' }, { label: 'Delete', value: 'DELETE' },
            { label: 'Export', value: 'EXPORT' }, { label: 'Print', value: 'PRINT' },
            { label: 'Approve', value: 'APPROVE' },
          ]},
          { name: 'name', label: 'Permission Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true },
        ],
      },
      {
        key: 'user-type-master',
        label: 'User Type Master',
        model: 'UserTypeMaster',
        icon: 'UserCog',
        description: 'User types in the system',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'User Type', type: 'select', required: true, options: [
            { label: 'Super Admin', value: 'SUPER_ADMIN' }, { label: 'Admin', value: 'ADMIN' },
            { label: 'Teacher', value: 'TEACHER' }, { label: 'Student', value: 'STUDENT' },
            { label: 'Parent', value: 'PARENT' }, { label: 'Staff', value: 'STAFF' },
            { label: 'Accountant', value: 'ACCOUNTANT' }, { label: 'Librarian', value: 'LIBRARIAN' },
          ]},
        ],
      },
      {
        key: 'module-master',
        label: 'Module Master',
        model: 'ModuleMaster',
        icon: 'LayoutGrid',
        description: 'System modules',
        requiredFields: ['name', 'code', 'route'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Module Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true },
          { name: 'icon', label: 'Icon Name', type: 'text' },
          { name: 'route', label: 'Route Path', type: 'text', required: true },
          { name: 'order', label: 'Display Order', type: 'number' },
          { name: 'parentId', label: 'Parent Module (ID)', type: 'text' },
        ],
      },
      {
        key: 'menu-master',
        label: 'Menu Master',
        model: 'MenuMaster',
        icon: 'Menu',
        description: 'Sidebar menu items',
        requiredFields: ['name', 'moduleId', 'route'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Menu Label', type: 'text', required: true },
          { name: 'moduleId', label: 'Module (ID)', type: 'text', required: true },
          { name: 'route', label: 'Route', type: 'text', required: true },
          { name: 'icon', label: 'Icon', type: 'text' },
          { name: 'order', label: 'Order', type: 'number' },
          { name: 'parentId', label: 'Parent Menu (ID)', type: 'text' },
        ],
      },
      {
        key: 'api-permission-master',
        label: 'API Permission Master',
        model: 'APIPermissionMaster',
        icon: 'Lock',
        description: 'API endpoint permissions',
        requiredFields: ['endpoint', 'method'],
        searchFields: ['endpoint', 'description'],
        fields: [
          { name: 'endpoint', label: 'API Endpoint', type: 'text', required: true, placeholder: '/api/students' },
          { name: 'method', label: 'Method', type: 'select', required: true, options: [
            { label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' }, { label: 'DELETE', value: 'DELETE' },
          ]},
          { name: 'roleIds', label: 'Allowed Roles (comma-separated IDs)', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 16. Document Masters
  // ─────────────────────────────────────────────
  {
    id: 'document',
    label: 'Document Masters',
    icon: 'FileCheck',
    description: 'Document types, categories, and approval workflows',
    models: [
      {
        key: 'document-type-master',
        label: 'Document Type Master',
        model: 'DocumentTypeMaster',
        icon: 'File',
        description: 'Types of documents',
        requiredFields: ['name', 'code'],
        searchFields: ['name', 'code', 'category'],
        fields: [
          { name: 'name', label: 'Document Type', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true },
          { name: 'maxSize', label: 'Max Size (MB)', type: 'number' },
          { name: 'allowedFormats', label: 'Allowed Formats (comma-separated)', type: 'text', placeholder: 'pdf,jpg,png,docx' },
          { name: 'isRequired', label: 'Required for Admission', type: 'boolean', defaultValue: false },
          { name: 'category', label: 'Category', type: 'text' },
        ],
      },
      {
        key: 'document-category-master',
        label: 'Document Category Master',
        model: 'DocumentCategoryMaster',
        icon: 'FolderOpen',
        description: 'Document categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'approval-workflow-master',
        label: 'Approval Workflow Master',
        model: 'ApprovalWorkflowMaster',
        icon: 'GitPullRequest',
        description: 'Multi-step approval workflows',
        requiredFields: ['name', 'module'],
        searchFields: ['name', 'module'],
        fields: [
          { name: 'name', label: 'Workflow Name', type: 'text', required: true },
          { name: 'module', label: 'Module', type: 'text', required: true },
          { name: 'steps', label: 'Steps (JSON)', type: 'textarea', placeholder: '[{"level":1,"roleId":"...","action":"APPROVE"}]' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 17. Event Masters
  // ─────────────────────────────────────────────
  {
    id: 'event',
    label: 'Event Masters',
    icon: 'CalendarHeart',
    description: 'Event categories, venues, and event types',
    models: [
      {
        key: 'event-category-master',
        label: 'Event Category Master',
        model: 'EventCategoryMaster',
        icon: 'Tag',
        description: 'Event categories',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          { name: 'color', label: 'Color', type: 'color' },
          { name: 'icon', label: 'Icon Name', type: 'text' },
        ],
      },
      {
        key: 'venue-master',
        label: 'Venue Master',
        model: 'VenueMaster',
        icon: 'MapPin',
        description: 'Event venues',
        requiredFields: ['name'],
        searchFields: ['name', 'location'],
        fields: [
          { name: 'name', label: 'Venue Name', type: 'text', required: true },
          { name: 'capacity', label: 'Capacity', type: 'number' },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'facilities', label: 'Facilities (comma-separated)', type: 'text' },
        ],
      },
      {
        key: 'event-type-master',
        label: 'Event Type Master',
        model: 'EventTypeMaster',
        icon: 'Calendar',
        description: 'Types of events',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Event Type', type: 'select', required: true, options: [
            { label: 'Academic', value: 'ACADEMIC' }, { label: 'Cultural', value: 'CULTURAL' },
            { label: 'Sports', value: 'SPORTS' }, { label: 'Seminar', value: 'SEMINAR' },
            { label: 'Workshop', value: 'WORKSHOP' }, { label: 'Competition', value: 'COMPETITION' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 18. Visitor Masters
  // ─────────────────────────────────────────────
  {
    id: 'visitor',
    label: 'Visitor Masters',
    icon: 'UserRound',
    description: 'Visitor types, purposes, and gate management',
    models: [
      {
        key: 'visitor-type-master',
        label: 'Visitor Type Master',
        model: 'VisitorTypeMaster',
        icon: 'UserPlus',
        description: 'Types of visitors',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Visitor Type', type: 'select', required: true, options: [
            { label: 'Parent', value: 'PARENT' }, { label: 'Vendor', value: 'VENDOR' },
            { label: 'Official', value: 'OFFICIAL' }, { label: 'Alumni', value: 'ALUMNI' },
            { label: 'Other', value: 'OTHER' },
          ]},
        ],
      },
      {
        key: 'purpose-master',
        label: 'Purpose Master',
        model: 'PurposeMaster',
        icon: 'Target',
        description: 'Visit purposes',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Purpose', type: 'text', required: true },
          { name: 'departmentId', label: 'Department (ID)', type: 'text' },
        ],
      },
      {
        key: 'gate-master',
        label: 'Gate Master',
        model: 'GateMaster',
        icon: 'DoorOpen',
        description: 'School gates',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'location'],
        fields: [
          { name: 'name', label: 'Gate Name', type: 'text', required: true },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Entry', value: 'ENTRY' }, { label: 'Exit', value: 'EXIT' }, { label: 'Both', value: 'BOTH' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 19. AI Masters
  // ─────────────────────────────────────────────
  {
    id: 'ai',
    label: 'AI Masters',
    icon: 'Brain',
    description: 'AI prompts, prediction rules, and analytics configurations',
    models: [
      {
        key: 'ai-prompt-master',
        label: 'AI Prompt Master',
        model: 'AIPromptMaster',
        icon: 'Sparkles',
        description: 'AI prompt templates',
        requiredFields: ['name', 'prompt', 'module', 'type'],
        searchFields: ['name', 'module'],
        fields: [
          { name: 'name', label: 'Prompt Name', type: 'text', required: true },
          { name: 'prompt', label: 'Prompt Text', type: 'textarea', required: true },
          { name: 'module', label: 'Module', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'Analysis', value: 'ANALYSIS' }, { label: 'Prediction', value: 'PREDICTION' },
            { label: 'Generation', value: 'GENERATION' },
          ]},
        ],
      },
      {
        key: 'prediction-rule-master',
        label: 'Prediction Rule Master',
        model: 'PredictionRuleMaster',
        icon: 'TrendingUp',
        description: 'AI prediction rules',
        requiredFields: ['name', 'module', 'action'],
        searchFields: ['name', 'module'],
        fields: [
          { name: 'name', label: 'Rule Name', type: 'text', required: true },
          { name: 'module', label: 'Module', type: 'text', required: true },
          { name: 'condition', label: 'Condition (JSON)', type: 'textarea' },
          { name: 'action', label: 'Action', type: 'text', required: true },
          { name: 'threshold', label: 'Threshold', type: 'number' },
        ],
      },
      {
        key: 'analytics-rule-master',
        label: 'Analytics Rule Master',
        model: 'AnalyticsRuleMaster',
        icon: 'BarChart3',
        description: 'Analytics visualization rules',
        requiredFields: ['name', 'module', 'metric'],
        searchFields: ['name', 'module', 'metric'],
        fields: [
          { name: 'name', label: 'Rule Name', type: 'text', required: true },
          { name: 'module', label: 'Module', type: 'text', required: true },
          { name: 'metric', label: 'Metric', type: 'text', required: true },
          { name: 'formula', label: 'Formula', type: 'text' },
          { name: 'visualization', label: 'Visualization Type', type: 'select', options: [
            { label: 'Line Chart', value: 'LINE' }, { label: 'Bar Chart', value: 'BAR' },
            { label: 'Pie Chart', value: 'PIE' }, { label: 'Table', value: 'TABLE' },
          ]},
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 20. System Masters
  // ─────────────────────────────────────────────
  {
    id: 'system',
    label: 'System Masters',
    icon: 'Settings',
    description: 'Theme, language, currency, timezone, backup policies, and system configurations',
    models: [
      {
        key: 'theme-master',
        label: 'Theme Master',
        model: 'ThemeMaster',
        icon: 'Palette',
        description: 'UI theme presets',
        requiredFields: ['name', 'primaryColor'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Theme Name', type: 'text', required: true },
          { name: 'primaryColor', label: 'Primary Color', type: 'color', required: true },
          { name: 'secondaryColor', label: 'Secondary Color', type: 'color' },
          { name: 'accentColor', label: 'Accent Color', type: 'color' },
          { name: 'fontFamily', label: 'Font Family', type: 'text' },
          { name: 'isDark', label: 'Dark Theme', type: 'boolean', defaultValue: false },
          { name: 'isDefault', label: 'Set as Default', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'currency-master',
        label: 'Currency Master',
        model: 'CurrencyMaster',
        icon: 'Coins',
        description: 'Supported currencies',
        requiredFields: ['name', 'code', 'symbol'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Currency Name', type: 'text', required: true },
          { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'INR' },
          { name: 'symbol', label: 'Symbol', type: 'text', required: true, placeholder: '₹' },
          { name: 'decimalPlaces', label: 'Decimal Places', type: 'number', defaultValue: 2 },
          { name: 'isDefault', label: 'Default Currency', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'timezone-master',
        label: 'Time Zone Master',
        model: 'TimeZoneMaster',
        icon: 'Clock',
        description: 'Time zone settings',
        requiredFields: ['name', 'offset', 'code'],
        searchFields: ['name', 'code'],
        fields: [
          { name: 'name', label: 'Time Zone Name', type: 'text', required: true },
          { name: 'offset', label: 'UTC Offset', type: 'text', required: true, placeholder: '+05:30' },
          { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'IST' },
          { name: 'isDefault', label: 'Default', type: 'boolean', defaultValue: false },
        ],
      },
      {
        key: 'backup-policy-master',
        label: 'Backup Policy Master',
        model: 'BackupPolicyMaster',
        icon: 'Database',
        description: 'Backup schedule policies',
        requiredFields: ['name', 'frequency'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Policy Name', type: 'text', required: true },
          { name: 'frequency', label: 'Frequency', type: 'select', required: true, options: [
            { label: 'Daily', value: 'DAILY' }, { label: 'Weekly', value: 'WEEKLY' }, { label: 'Monthly', value: 'MONTHLY' },
          ]},
          { name: 'retentionDays', label: 'Retention (days)', type: 'number' },
          { name: 'time', label: 'Backup Time', type: 'text', placeholder: '02:00' },
          { name: 'isAutomatic', label: 'Automatic', type: 'boolean', defaultValue: true },
        ],
      },
      {
        key: 'audit-type-master',
        label: 'Audit Type Master',
        model: 'AuditTypeMaster',
        icon: 'Eye',
        description: 'Types of audit actions',
        requiredFields: ['name'],
        searchFields: ['name'],
        fields: [
          { name: 'name', label: 'Audit Action', type: 'select', required: true, options: [
            { label: 'Login', value: 'LOGIN' }, { label: 'Logout', value: 'LOGOUT' },
            { label: 'Create', value: 'CREATE' }, { label: 'Update', value: 'UPDATE' },
            { label: 'Delete', value: 'DELETE' }, { label: 'Export', value: 'EXPORT' },
            { label: 'Print', value: 'PRINT' }, { label: 'Approve', value: 'APPROVE' },
            { label: 'Reject', value: 'REJECT' },
          ]},
        ],
      },
      {
        key: 'api-provider-master',
        label: 'API Provider Master',
        model: 'APIProviderMaster',
        icon: 'Plug',
        description: 'Third-party API providers',
        requiredFields: ['name', 'type'],
        searchFields: ['name', 'type'],
        fields: [
          { name: 'name', label: 'Provider Name', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { label: 'SMS', value: 'SMS' }, { label: 'Email', value: 'EMAIL' },
            { label: 'WhatsApp', value: 'WHATSAPP' }, { label: 'Payment', value: 'PAYMENT' },
            { label: 'Maps', value: 'MAPS' }, { label: 'Storage', value: 'STORAGE' },
          ]},
          { name: 'baseUrl', label: 'Base URL', type: 'url' },
          { name: 'apiKey', label: 'API Key', type: 'text' },
        ],
      },
      {
        key: 'settings-master',
        label: 'Settings Master',
        model: 'SettingsMaster',
        icon: 'Wrench',
        description: 'General key-value settings',
        requiredFields: ['module', 'key', 'value', 'type'],
        searchFields: ['module', 'key', 'description'],
        fields: [
          { name: 'module', label: 'Module', type: 'text', required: true },
          { name: 'key', label: 'Setting Key', type: 'text', required: true },
          { name: 'value', label: 'Value', type: 'text', required: true },
          { name: 'type', label: 'Value Type', type: 'select', required: true, options: [
            { label: 'String', value: 'STRING' }, { label: 'Number', value: 'NUMBER' },
            { label: 'Boolean', value: 'BOOLEAN' }, { label: 'JSON', value: 'JSON' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Helper: Get config by model key
// ─────────────────────────────────────────────
export function getMasterConfig(modelKey: string): MasterModelConfig | undefined {
  for (const category of MASTER_CATEGORIES) {
    const found = category.models.find(m => m.key === modelKey);
    if (found) return found;
  }
  return undefined;
}

// ─────────────────────────────────────────────
// Helper: Get all model keys
// ─────────────────────────────────────────────
export function getAllMasterKeys(): string[] {
  return MASTER_CATEGORIES.flatMap(cat => cat.models.map(m => m.key));
}

// ─────────────────────────────────────────────
// Helper: Model key to Prisma model name mapping
// ─────────────────────────────────────────────
export function getPrismaModelName(modelKey: string): string | undefined {
  const config = getMasterConfig(modelKey);
  return config?.model;
}

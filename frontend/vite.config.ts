import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build-time safety net for Organization/Academic Master relation fields.
// This runs inside Vite itself, so the Elective Subject dropdown fix cannot be
// skipped by a deployment that bypasses npm lifecycle scripts.
const electiveMasterBuildFix = () => ({
  name: 'elective-subject-master-build-fix',
  transform(code: string, id: string) {
    if (!id.endsWith('/src/pages/masters/MasterModule.tsx')) return null
    if (code.includes('modelKey === "elective-subject-master"')) return null

    const marker = '  return configuredFields;\n}\n\nfunction getEntryId'
    if (!code.includes(marker)) {
      throw new Error('Elective Subject Master build fix: MasterModule marker not found')
    }

    const replacement = `  if (modelKey === "elective-subject-master") {
    const electiveFields: any[] = [
      { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "streamId", label: "Stream", type: "lookup", lookupUrl: "/api/masters/stream-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      { name: "maxStudents", label: "Max Students", type: "number" },
    ];
    return electiveFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
  }

  return configuredFields;
}

function getEntryId`

    return {
      code: code.replace(marker, replacement),
      map: null,
    }
  },
})

// Timetable Slot Master must be canonical at the final Vite transform stage.
// This deliberately rewrites only the getEffectiveFields resolver so an older
// or partially patched checkout cannot leave ObjectId text inputs in the UI.
const timetableSlotMasterBuildFix = () => ({
  name: 'timetable-slot-master-build-fix',
  transform(code: string, id: string) {
    if (!id.endsWith('/src/pages/masters/MasterModule.tsx')) return null

    const resolverStart = code.indexOf('function getEffectiveFields')
    const entryMarker = 'function getEntryId'
    const entryIndex = code.indexOf(entryMarker, resolverStart)
    if (resolverStart < 0 || entryIndex < 0 || entryIndex <= resolverStart) {
      throw new Error('Timetable Slot Master build fix: MasterModule resolver not found')
    }

    const resolver = code.slice(resolverStart, entryIndex)
    const cleanResolver = resolver.replace(/\n  if \(modelKey === "timetable-slot-master"\) \{[\s\S]*?\n  \}\n(?=\n  return configuredFields;)/, '')
    const returnMarker = '  return configuredFields;'
    const returnIndex = cleanResolver.lastIndexOf(returnMarker)
    if (returnIndex < 0) {
      throw new Error('Timetable Slot Master build fix: resolver return marker not found')
    }

    const timetableBlock = `  if (modelKey === "timetable-slot-master") {
    const timetableFields: any[] = [
      { name: "dayOfWeek", label: "Day", type: "select", required: true, options: [
        { label: "Monday", value: "1" }, { label: "Tuesday", value: "2" }, { label: "Wednesday", value: "3" },
        { label: "Thursday", value: "4" }, { label: "Friday", value: "5" }, { label: "Saturday", value: "6" }, { label: "Sunday", value: "0" },
      ] },
      { name: "periodId", label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "sectionId", label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },
      { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },
      { name: "teacherId", label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },
      { name: "roomId", label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },
    ];
    return timetableFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
  }

`

    const patchedResolver = cleanResolver.slice(0, returnIndex) + timetableBlock + cleanResolver.slice(returnIndex)
    return {
      code: code.slice(0, resolverStart) + patchedResolver + code.slice(entryIndex),
      map: null,
    }
  },
})

export default defineConfig({
  plugins: [electiveMasterBuildFix(), timetableSlotMasterBuildFix(), react()],

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/canvg') ||
              id.includes('node_modules/dompurify')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/sonner')) {
            return 'vendor-toast';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-dates';
          }
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/qs')) {
            return 'vendor-http';
          }
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },

  server: {
    port: 5174,
    proxy: {
      '/api/designer': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/designer/, '/api'),
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})

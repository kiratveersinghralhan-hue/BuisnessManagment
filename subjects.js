/* Boardroom: every subject of BBA in Digital Science & Business Management.
   To add content for a subject, upload its subject-xxx.js file and set "file" below. */
window.PROGRAM = {
  name: "BBA in Digital Science & Business Management",
  short: "BBA DS & BM",
  school: "Chitkara Business School",
  batch: "2026–29"
};
window.SUBJECTS = [
  { id: "pbm", tagline: "Crack the case, not just the syllabus.", code: "26BBM1104", name: "Principles of Business Management", short: "Business Management", year: 1, sem: 1, teacher: "Dr. Sulochna Syal", file: "subject-pbm.js", v: 6, icon: "📊", grad: ["#8B5CF6", "#EC4899"],
    exam: { date: "2026-10-24T09:30:00+05:30", session: "Morning · 9:30 am – 12:30 pm", pattern: "100 marks: MCQs 20 · short 30 · long 30 · case study 20" },
    paper: { format: "4sec", title: "End-term exam (official format)", minutes: 180, total: 100, mcq: 10, mcqCaseSets: 0, mcqModes: [[10, 2], [20, 1]], shortShow: 6, shortAttempt: 5, shortMarks: 6, shortWords: 100, longShow: 4, longAttempt: 3, longMarks: 10, longWords: 500, caseQs: 2, caseMarks: 10, note: "" } },
  { id: "prog", tagline: "Think in logic, answer in code.", code: "26BBM1100", name: "Programming Fundamentals", short: "Programming", year: 1, sem: 1, file: "subject-prog.js", v: 2, icon: "💻", grad: ["#0EA5E9", "#14B8A6"],
    exam: { date: "2026-10-31T09:30:00+05:30", session: "Morning · 9:30 – 11:30 am · computer-based", pattern: "100 MCQs" },
    paper: { type: "mcq", title: "End-term MCQ test", questions: 100, minutes: 120 } },
  { id: "alac", tagline: "Every curve has a story.", code: "26BBM1103", name: "Applied Linear Algebra and Calculus", short: "Linear Algebra & Calculus", year: 1, sem: 1, file: null, icon: "📐", grad: ["#F97316", "#FBBF24"] },
  { id: "dviz", tagline: "Turn numbers into insight.", code: "26BBM1106", name: "Data Visualization", short: "Data Visualization", year: 1, sem: 1, file: null, icon: "📈", grad: ["#22C55E", "#14B8A6"] },
  { id: "aiml", tagline: "Teach machines, think smarter.", code: "26BBM1107", name: "Introduction to AI and ML", short: "AI & ML", year: 1, sem: 1, file: null, icon: "🤖", grad: ["#6366F1", "#38BDF8"] },
  { id: "drm", tagline: "Your name is your brand.", code: "25BBM1102", name: "Digital Reputation Management-I", short: "Digital Reputation", year: 1, sem: 1, file: null, icon: "🛡️", grad: ["#EC4899", "#F43F5E"] },
  { id: "arts", tagline: "Find your stage.", code: "26BBM1105", name: "Performing Arts", short: "Performing Arts", year: 1, sem: 1, file: null, icon: "🎭", grad: ["#A855F7", "#F472B6"] }
];

/* Boardroom: every subject of BBA in Digital Science & Business Management.
   To add content for a subject, upload its subject-xxx.js file and set "file" below. */
window.PROGRAM = {
  name: "BBA in Digital Science & Business Management",
  short: "BBA DS & BM",
  school: "Chitkara Business School",
  batch: "2026–29"
};
window.SUBJECTS = [
  { id: "pbm", tagline: "Crack the case, not just the syllabus.", code: "26BBM1104", name: "Principles of Business Management", short: "Business Management", year: 1, sem: 1, teacher: "Dr. Sulochna Syal", file: "subject-pbm.js", v: 7, icon: "📊", grad: ["#FF3B44", "#8E0A12"],
    exam: { date: "2026-10-24T09:30:00+05:30", session: "Morning · 9:30 am – 12:30 pm", pattern: "100 marks: MCQs 20 · short 30 · long 30 · case study 20" },
    paper: { format: "4sec", title: "End-term exam (official format)", minutes: 180, total: 100, mcq: 10, mcqCaseSets: 0, mcqModes: [[10, 2], [20, 1]], shortShow: 6, shortAttempt: 5, shortMarks: 6, shortWords: 100, longShow: 4, longAttempt: 3, longMarks: 10, longWords: 500, caseQs: 2, caseMarks: 10, note: "" } },
  { id: "prog", tagline: "Think in logic, answer in code.", code: "26BBM1100", name: "Programming Fundamentals", short: "Programming", year: 1, sem: 1, file: "subject-prog.js", v: 2, icon: "💻", grad: ["#2B2B30", "#0B0B0C"],
    exam: { date: "2026-10-31T09:30:00+05:30", session: "Morning · 9:30 – 11:30 am · computer-based", pattern: "100 MCQs" },
    paper: { type: "mcq", title: "End-term MCQ test", questions: 100, minutes: 120 } },
  { id: "alac", tagline: "Every curve has a story.", code: "26BBM1103", name: "Applied Linear Algebra and Calculus", short: "Linear Algebra & Calculus", year: 1, sem: 1, teacher: "Dr. Gurpreet Singh", file: "subject-alac.js", v: 1, icon: "📐", grad: ["#D7141E", "#2B0A0E"],
    exam: { pattern: "100 marks: MCQs 20 · short 30 · long 30 · case study 20 · ETE carries 70%" },
    paper: { format: "4sec", title: "End-term exam (university format)", minutes: 180, total: 100, mcq: 10, mcqCaseSets: 0, mcqModes: [[10, 2], [20, 1]], shortShow: 6, shortAttempt: 5, shortMarks: 6, shortWords: 100, longShow: 4, longAttempt: 3, longMarks: 10, longWords: 500, caseQs: 2, caseMarks: 10, note: "Chitkara end-term template (Sections A–D), as posted on CULMS." } },
  { id: "dviz", tagline: "Turn numbers into insight.", code: "26BBM1106", name: "Data Visualization", short: "Data Visualization", year: 1, sem: 1, file: null, icon: "📈", grad: ["#3A3A40", "#111113"] },
  { id: "aiml", tagline: "Teach machines, think smarter.", code: "26BBM1107", name: "Introduction to AI and ML", short: "AI & ML", year: 1, sem: 1, file: "subject-aiml.js", v: 1, icon: "🤖", grad: ["#0B0B0C", "#D7141E"],
    paper: { format: "4sec", title: "End-term exam (university format)", minutes: 180, total: 100, mcq: 10, mcqCaseSets: 0, mcqModes: [[10, 2], [20, 1]], shortShow: 6, shortAttempt: 5, shortMarks: 6, shortWords: 100, longShow: 4, longAttempt: 3, longMarks: 10, longWords: 500, caseQs: 2, caseMarks: 10, note: "Chitkara end-term template (Sections A–D), as posted on CULMS." } },
  { id: "drm", tagline: "Your name is your brand.", code: "25BBM1102", name: "Digital Reputation Management-I", short: "Digital Reputation", year: 1, sem: 1, file: null, icon: "🛡️", grad: ["#E8495A", "#7A0B13"] },
  { id: "arts", tagline: "Find your stage.", code: "26BBM1105", name: "Performing Arts", short: "Performing Arts", year: 1, sem: 1, file: null, icon: "🎭", grad: ["#6B6B70", "#1C1C1F"] }
];

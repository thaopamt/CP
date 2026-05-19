import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";
console.log("Starting Live Monitor E2E Test (with initial code fetch test)...");

const adminSocket = io(`${API_URL}/live-monitor`, { transports: ["websocket"] });

adminSocket.on("connect", () => {
  adminSocket.emit("admin_join");
});

adminSocket.on("active_students_list", (list) => {
  const testStudent = list.find(s => s.studentId === "test_student_123");
  if (testStudent) {
    console.log("[Admin] Found test student. Waiting 500ms to ensure initial code is cached...");
    setTimeout(() => {
      console.log("[Admin] Sending 'admin_watch_student'...");
      adminSocket.emit("admin_watch_student", {
        studentId: testStudent.studentId,
        problemId: testStudent.problemId
      });
    }, 500);
  }
});

adminSocket.on("code_update", (data) => {
  console.log(`\n[Admin] Received code_update for ${data.studentId} (${data.language}):`);
  console.log(`----------------------------------------\n${data.code}\n----------------------------------------`);
});

// Student
setTimeout(() => {
  const studentSocket = io(`${API_URL}/live-monitor`, { transports: ["websocket"] });
  
  studentSocket.on("connect", () => {
    const payload = {
      studentId: "test_student_123",
      problemId: "problem_xyz",
      studentName: "Test User",
      language: "javascript",
    };
    
    studentSocket.emit("join_workspace", payload);
    studentSocket.emit("code_change", {
      ...payload,
      code: "// Initial cached code!"
    });
    
    setTimeout(() => {
      console.log("\n[Student] Typing new code...");
      studentSocket.emit("code_change", {
        ...payload,
        code: "// New code typed!"
      });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }, 1500);
  });
}, 500);

import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";
console.log("Starting Live Monitor E2E Test...");

// 1. Admin setup
const adminSocket = io(`${API_URL}/live-monitor`, { transports: ["websocket"] });
let adminReceivedCode = null;

adminSocket.on("connect", () => {
  console.log("[Admin] Connected with ID:", adminSocket.id);
  adminSocket.emit("admin_join");
});

adminSocket.on("active_students_list", (list) => {
  console.log("[Admin] Received active students list:", list.length, "students online");
  
  // Find our test student
  const testStudent = list.find(s => s.studentId === "test_student_123");
  if (testStudent) {
    console.log("[Admin] Found test student in list. Sending 'admin_watch_student'...");
    adminSocket.emit("admin_watch_student", {
      studentId: testStudent.studentId,
      problemId: testStudent.problemId
    });
  }
});

adminSocket.on("code_update", (data) => {
  console.log(`\n[Admin] Received code_update for ${data.studentId} (${data.language}):`);
  console.log(`----------------------------------------\n${data.code}\n----------------------------------------`);
  adminReceivedCode = data.code;
});

// 2. Student setup
setTimeout(() => {
  const studentSocket = io(`${API_URL}/live-monitor`, { transports: ["websocket"] });
  
  studentSocket.on("connect", () => {
    console.log("\n[Student] Connected with ID:", studentSocket.id);
    
    // Join workspace
    const payload = {
      studentId: "test_student_123",
      problemId: "problem_xyz",
      studentName: "Test User",
      language: "javascript",
    };
    
    console.log("[Student] Joining workspace and emitting initial code...");
    studentSocket.emit("join_workspace", payload);
    
    // Emit initial code
    studentSocket.emit("code_change", {
      ...payload,
      code: "// Initial code\nfunction solve() {\n  \n}"
    });
    
    // Simulate typing after 2 seconds
    setTimeout(() => {
      console.log("\n[Student] Typing new code...");
      studentSocket.emit("code_change", {
        ...payload,
        code: "// Initial code\nfunction solve() {\n  console.log('Hello from test!');\n}"
      });
      
      // Finish test
      setTimeout(() => {
        console.log("\nTest Completed successfully!");
        adminSocket.disconnect();
        studentSocket.disconnect();
        process.exit(0);
      }, 1000);
    }, 2000);
  });
}, 1000);

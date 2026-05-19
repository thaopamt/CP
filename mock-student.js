import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";
const studentSocket = io(`${API_URL}/live-monitor`, { transports: ["websocket"] });

let counter = 0;

studentSocket.on("connect", () => {
  console.log("Mock student connected:", studentSocket.id);
  
  const payload = {
    studentId: "mock_student_999",
    problemId: "demo_problem",
    studentName: "Mock Test Student",
    language: "javascript",
  };
  
  studentSocket.emit("join_workspace", payload);
  
  setInterval(() => {
    counter++;
    const code = `// Automatically generated typing...
function helloWorld() {
  console.log("Typing simulation tick: ${counter}");
  return ${counter * 42};
}`;
    
    studentSocket.emit("code_change", {
      ...payload,
      code: code
    });
    console.log("Emitted code update", counter);
  }, 2000); // type something every 2 seconds
});

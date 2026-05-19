import { io } from "socket.io-client";

const socket = io("http://localhost:3000/live-monitor", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
});

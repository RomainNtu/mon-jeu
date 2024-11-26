import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL); // Connect to server using environment variable
export default socket;
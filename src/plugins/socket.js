import Socket from "socket.io-client"

const URL = "http://localhost:5000";
const socket = Socket(URL, { autoConnect: false })

export default socket

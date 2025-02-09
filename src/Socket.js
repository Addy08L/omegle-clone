import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChat } from './contextApi/ChatContext';

// Replace this with your Railway WebSocket server URL
const URL = "wss://qmegle-signaling-server-production.up.railway.app"; // Your Railway WebSocket URL


export const socket = new WebSocket(URL);

const Socket = () => {
    const { setUserId, setIsConnected, setMessages, setOnlineUsers, setReceiver, setIsSearching, setIsTyping, setMessage, setIsSending } = useChat();

    useEffect(() => {
        socket.onopen = () => {
            console.log("Connected to WebSocket signaling server");
            setIsConnected(true);
        };

        socket.onclose = () => {
            console.log("Disconnected from WebSocket signaling server");
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [setIsConnected]);

    useEffect(() => {
        const uniqueId = uuidv4();
        setUserId(uniqueId);
        
        socket.send(JSON.stringify({ type: "new-online-user", userId: uniqueId }));

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "get-online-users") {
                setOnlineUsers(data.users);
            } else if (data.type === "send-message") {
                setMessages((previous) => [...previous, { stranger: data.message }]);
                setIsTyping(false);
            } else if (data.type === "receive-message") {
                setMessages((previous) => [...previous, { you: data.message }]);
                setIsSending(false);
            } else if (data.type === "user-paired") {
                setReceiver(data.receiver);
                setIsSearching(false);
            } else if (data.type === "chat-close") {
                setReceiver("");
                setMessage("");
                setIsTyping(false);
            } else if (data.type === "typing") {
                setIsTyping(true);
            } else if (data.type === "typing stop") {
                setIsTyping(false);
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [setUserId, setOnlineUsers, setMessages, setReceiver, setIsSearching, setIsTyping, setMessage, setIsSending]);
};

export default Socket;

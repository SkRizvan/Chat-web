import { useState, useEffect } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input,setInput] =useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) return;  // Ensure the currentUser is available

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const data = res.data();

        // Check if data exists and has 'chats' field
        if (data && data.chats) {
          const items = data.chats;

          const promises = items.map(async (item) => {
            try {
              const userDocRef = doc(db, "users", item.receiverId);
              const userDocSnap = await getDoc(userDocRef);
              const user = userDocSnap.exists() ? userDocSnap.data() : null;

              return { ...item, user };
            } catch (error) {
              console.log("Error fetching user:", error);
              return { ...item, user: null }; // Fallback to `null` if there's an error
            }
          });

          const chatData = await Promise.all(promises);
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt)); // Ensure sorting works correctly
        } else {
          // Handle case when no chats are found
          setChats([]); // Reset the chats to an empty array
        }
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser?.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    if (chatIndex !== -1) {
      userChats[chatIndex].isSeen = true; // Set `isSeen` to true for the selected chat
    }

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user); // Update the selected chat
    } catch (error) {
      console.log("Error updating chat selection:", error);
    }
  };

  const filteredChats=chats.filter((c)=>c.user.username.toLowerCase().includes(input.toLowerCase()))

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="" />
          <input type="text" placeholder="Search" onChange={(e)=> setInput(e.target.value)}/>
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
        >
          <img
            src={chat.user.blocked.includes(currentUser.id)? "./avatar.png" : chat.user?.avatar || "./avatar.png"}  // Ensure `photoURL` is safely accessed
            alt="User Avatar"
            onError={(e) => { e.target.src = './avatar.png'; }}  // Fallback to default image if the photoURL fails to load
          />
          
          <div className="texts">
          <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}</span> {/* Fallback for username */}
            <p>{chat.lastMessage || "No message available"}</p>  {/* Fallback for lastMessage */}
          </div>
          
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;

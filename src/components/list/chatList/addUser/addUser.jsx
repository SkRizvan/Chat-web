import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null); // Initially null, no user selected yet
  const { currentUser } = useUserStore(); // Getting the current user from userStore

  // Search for a user by username
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const foundUser = querySnapShot.docs[0].data();
        setUser({
          ...foundUser, // Ensure the ID from Firestore is preserved
          id: querySnapShot.docs[0].id
        });
        console.log("User found:", foundUser);
      } else {
        setUser(null); // No user found, reset state
        console.log("No user found with the username:", username);
      }
    } catch (err) {
      console.log("Error searching for user:", err);
    }
  };

  // Handle adding a user to a chat
  const handleAdd = async () => {
    if (!user || !currentUser) {
      console.log("Either the searched user or current user is missing.");
      return;
    }

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      // Create a new chat document in the "chats" collection
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const userChatDocRef = doc(userChatsRef, user.id);
      const currentUserChatDocRef = doc(userChatsRef, currentUser.id);

      // Check if user chat documents exist, if not, create them
      const userChatDocSnap = await getDoc(userChatDocRef);
      const currentUserChatDocSnap = await getDoc(currentUserChatDocRef);

      if (!userChatDocSnap.exists()) {
        await setDoc(userChatDocRef, {
          chats: [], // Initialize the chats array for the user
        });
        console.log("Created new chat document for user:", user.id);
      }

      if (!currentUserChatDocSnap.exists()) {
        await setDoc(currentUserChatDocRef, {
          chats: [], // Initialize the chats array for the current user
        });
        console.log("Created new chat document for current user:", currentUser.id);
      }

      // Now proceed with updating the chat documents for both users
      await updateDoc(userChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });
      console.log("Updated chat document for user:", user.id);

      await updateDoc(currentUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
      console.log("Updated chat document for current user:", currentUser.id);

    } catch (err) {
      console.log("Error adding user to chat:", err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" required />
        <button>Search</button>
      </form>

      {user ? (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add user</button>
        </div>
      ) : (
        <p>No user found</p>
      )}
    </div>
  );
};

export default AddUser;

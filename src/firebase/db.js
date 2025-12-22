// src/firebase/db.js
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import app from "./firebaseConfig";

const db = getFirestore(app);

// Example: Create a new lobby
export const createLobby = async (lobbyData) => {
  const lobbiesCol = collection(db, "lobbies");
  const docRef = await addDoc(lobbiesCol, lobbyData);
  return docRef.id;
};

// Example: Get a lobby by ID
export const getLobbyById = async (id) => {
  const docRef = doc(db, "lobbies", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export default db;
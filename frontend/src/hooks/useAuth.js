import { useSelector } from "react-redux";

// Thin convenience wrapper so components don't all need to know the Redux
// state shape — mirrors the old `useAuth()` from Hooks/AuthHook.js, but reads
// from the store instead of local component state + localStorage.
export const useAuth = () => {
  const auth = useSelector((state) => state.auth);
  return { ...auth, isLoggedIn: !!auth.userId };
};
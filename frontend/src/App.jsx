import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";

import { fetchProfile } from "./store/authSlice";
import { useAuth } from "./hooks/useAuth";

import Navbar from "./components/Navbar/Navbar";
import Signup from "./components/Signup/Signup";
import Login from "./components/Login/Login";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import Upload from "./components/Upload/Upload";
import Subscription from "./components/Subscription/Subscription";
import Question from "./components/Question/Question";
import Dashboard from "./components/Dashboard/Dashboard";
import AboutUs from "./components/AboutUs/AboutUs";

function App() {
  const dispatch = useDispatch();
  const { userId, authChecked } = useAuth();

  // The JWT lives in an httpOnly cookie the browser sends automatically —
  // this is how we find out on load whether that cookie is still valid,
  // replacing the old localStorage "userData" + manual expiry-timer logic.
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Avoid a flash of the logged-out routes while that check is in flight.
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {!userId ? (
              <>
                <Route path="/" element={<Hero />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/aboutUs" element={<AboutUs />} />
                <Route path="/*" element={<Signup />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/papers" element={<Question />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/paper/:id" element={<Question />} />
                <Route path="/aboutUs" element={<AboutUs />} />
                <Route path="/*" element={<Dashboard />} />
              </>
            )}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

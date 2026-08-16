import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as motion from "motion/react-client";
import { Assets } from "../../assets/Assets";
import { signup } from "../../store/authSlice";
import { getCoursesApi } from "../../api/course.api";
import Spinner from "../Spinner/Spinner";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Password: "",
    referralCode: "",
  });

  const [selectedCourses, setSelectedCourses] = useState([]);
  const [coursesData, setCoursesData] = useState([]);

  useEffect(() => {
    getCoursesApi()
      .then((envelope) => setCoursesData(envelope.data || []))
      .catch((error) => console.error("Error loading courses:", error));
  }, []);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    if (!courseId || selectedCourses.includes(courseId)) return;

    setSelectedCourses((prev) => [...prev, courseId]);
  };

  const removeCourse = (courseId) => {
    setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(
        signup({
          ...formData,
          enrolledCourses: selectedCourses,
        })
      ).unwrap();
      console.log("signup successfully");
      toast.success("Successfully signed up");
      navigate("/", { replace: true });
      console.log("navigated correctly");
    } catch (message) {
      toast.error(typeof message === "string" ? message : "An error occurred, try again later");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`fixed top-0 left-0 right-0 bottom-0 z-20 p-10 flex justify-center items-center ${
        loading ? "backdrop-blur-md" : "backdrop-blur-xs"
      } bg-black/30`}
    >
      <form onSubmit={handleSubmit} className="bg-white relative p-10 rounded-xl text-slate-500 w-96">
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <h1 className="text-2xl font-medium text-center text-neutral-700">
            Sign up
          </h1>
          <p className="text-sm text-center mb-4">
            Welcome! Please sign up to continue
          </p>

          <div className="border border-gray-300 flex items-center gap-2 px-4 py-2 rounded-full mt-4">
            <img src={Assets.email_icon} alt="User Icon" />
            <input
              id="Name"
              name="Name"
              type="text"
              required
              placeholder="Full Name"
              value={formData.Name}
              onChange={handleChange}
              className="w-full outline-none placeholder-gray-400"
            />
          </div>

          <div className="border border-gray-300 flex items-center gap-2 px-4 py-2 rounded-full mt-4">
            <img src={Assets.email_icon} alt="Email Icon" />
            <input
              id="Email"
              name="Email"
              type="email"
              required
              placeholder="Email"
              value={formData.Email}
              onChange={handleChange}
              className="w-full outline-none placeholder-gray-400"
            />
          </div>

          <div className="border border-gray-300 flex items-center gap-2 px-4 py-2 rounded-full mt-4">
            <img src={Assets.lock_icon} alt="Lock Icon" />
            <input
              name="Password"
              type="password"
              required
              placeholder="Password"
              value={formData.Password}
              onChange={handleChange}
              className="w-full outline-none placeholder-gray-400"
            />
          </div>

          <>
              {refOpen && (
                <div className="border border-gray-300 flex items-center gap-2 px-4 py-2 rounded-full mt-4">
                  <img src={Assets.email_icon} alt="Referral Icon" />
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="Referral Code (Optional)"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="w-full outline-none placeholder-gray-400"
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                {selectedCourses.map((courseId) => {
                  const course = coursesData.find((item) => item._id === courseId);
                  if (!course) return null;

                  return (
                    <div
                      key={courseId}
                      className="flex items-center justify-between gap-3 rounded-full border border-gray-300 px-4 py-2 text-sm"
                    >
                      <span className="truncate">{course.code} - {course.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCourse(courseId)}
                        aria-label={`Remove ${course.code} - ${course.name}`}
                        className="text-xl leading-none text-slate-500 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}

                {selectedCourses.length < 5 && (
                  <select
                    value=""
                    onChange={handleCourseChange}
                    className="w-full border border-gray-300 rounded-full px-4 py-2 outline-none"
                  >
                    <option value="">Select a course</option>
                    {coursesData
                      .filter((course) => !selectedCourses.includes(course._id))
                      .map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <p
                onClick={() => setRefOpen(true)}
                className="text-sm text-blue-600 my-4 cursor-pointer text-center"
              >
                Have a referral code?
              </p>
          </>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-white font-semibold shadow-md hover:bg-indigo-500 mt-4 disabled:opacity-60"
          >
            {loading ? <Spinner className="h-5 w-5" /> : "Sign Up"}
          </button>

          <p className="text-sm text-center mt-4 text-neutral-600">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="hover:text-indigo-600">
              Login
            </button>
          </p>
        </div>

        <img
          onClick={() => navigate("/")}
          src={Assets.cross_icon}
          alt="Close"
          className="absolute top-5 right-5 cursor-pointer w-5 h-5"
        />
      </form>
    </motion.div>
  );
}

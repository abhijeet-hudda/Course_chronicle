import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "./Question.css";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Assets } from "../../assets/Assets";
import { useAuth } from "../../hooks/useAuth";
import { updateCredit } from "../../store/authSlice";
import {
  getPapersApi,
  getPaperByIdApi,
  updateBrowsedCourseApi,
} from "../../api/question.api";
import { getUnlockedAnswersApi, unlockAnswerApi } from "../../api/auth.api";

const getFileURL = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  return `${base}/${path}`;
};

const QuestionList = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [unlockedAnswers, setUnlockedAnswers] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (id) {
      getPaperByIdApi(id)
        .then((envelope) => {
          if (envelope.data) setSelectedPaper(envelope.data);
        })
        .catch((error) => console.error("Error fetching paper:", error));
    } else {
      getPapersApi()
        .then((envelope) => setPapers(envelope.data || []))
        .catch((error) => console.error("Error fetching papers:", error));
    }
  }, [id]);

  useEffect(() => {
    if (selectedPaper) {
      getUnlockedAnswersApi(selectedPaper._id)
        .then((envelope) => {
          const unlocked = {};
          (envelope.data?.unlockedAnswers || []).forEach((qIndex) => {
            unlocked[qIndex] = true;
          });
          setUnlockedAnswers(unlocked);
        })
        .catch((error) => {
          console.error("Error fetching unlocked answers:", error);
          setUnlockedAnswers({});
        });
    }
  }, [selectedPaper]);

  const handlePaperClick = (paper) => {
    setSelectedPaper(paper);

    updateBrowsedCourseApi(paper.course.code).catch((error) =>
      console.error("Error updating browsed courses:", error)
    );
  };

  const handleClose = () => {
    setSelectedPaper(null);
  };

  const handleUnlock = async (index) => {
    if (auth.credit < 5) {
      toast.error("Not enough credits to unlock this answer.");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to unlock this answer for 5 credits?");
    if (!confirmed) return;

    try {
      const envelope = await unlockAnswerApi(selectedPaper._id, index);
      dispatch(updateCredit(envelope.data.credit));
      setUnlockedAnswers((prev) => ({ ...prev, [index]: true }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unlock answer.");
    }
  };

  const filteredPapers = papers.filter((paper) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const courseCode = paper.course?.code?.toLowerCase() || "";
    const courseName = paper.course?.name?.toLowerCase() || "";
    const tags = (paper.questions || []).map((q) => q.tag?.toLowerCase() || "").join(" ");
    return courseCode.includes(query) || courseName.includes(query) || tags.includes(query);
  });

  return (
    <div className="w-full p-6 mx-auto mt-16 bg-gray-900 text-white shadow-2xl border border-gray-700">
      {!selectedPaper ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Uploaded Papers</h2>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by course code, name, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-2 rounded-3xl bg-gray-800 border border-gray-600 text-white pl-12"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <img src={Assets.search_icon} alt="search" className="w-5 h-5" />
            </span>
          </div>
          <ul className="space-y-4">
            {filteredPapers.map((paper) => (
              <li
                key={paper._id}
                className="p-5 bg-gray-800 border border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition duration-300 cursor-pointer"
                onClick={() => handlePaperClick(paper)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">
                      [{paper.course ? `${paper.course.code}] ${paper.course.name}` : "N/A"}
                    </span>
                    <span className="ml-2 text-lg">({paper.examType})</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(paper.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-400">
                    Session: {paper.session} {paper.sessionYear}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(paper.questions || []).map((q, idx) =>
                    q.tag ? (
                      <span key={idx} className="bg-gray-700 text-xs px-2 py-1 rounded">
                        {q.tag}
                      </span>
                    ) : null
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex">
          <div className="w-1/2 p-4 bg-gray-800 border-r border-gray-700">
            <h3 className="text-lg font-bold mb-4">{selectedPaper.title}</h3>
            {selectedPaper.filePath.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={getFileURL(selectedPaper.filePath)}
                title="Paper"
                className="w-full h-[80vh] border border-gray-600"
              ></iframe>
            ) : (
              <img
                src={getFileURL(selectedPaper.filePath)}
                alt="Question Paper"
                className="w-full h-[80vh] object-contain border border-gray-600"
              />
            )}
          </div>

          <div className="w-1/2 p-4 bg-gray-800 overflow-y-auto h-[90vh]">
            <h3 className="text-lg font-bold mb-4">Questions and Answers</h3>
            <ul className="space-y-4">
              {selectedPaper.questions.map((qa, index) => (
                <li key={index} className="p-4 bg-gray-700 border border-gray-600 rounded-lg shadow-md">
                  <h4 className="font-bold">
                    Q{index + 1}: {qa.question}
                  </h4>
                  <hr className="mt-2 border-gray-600" />
                  <div className="mt-2 text-gray-100">
                    {unlockedAnswers[index] ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          math: ({ ...props }) => (
                            <div className="w-full my-4 flex justify-center">
                              <span {...props} />
                            </div>
                          ),
                          inlineMath: ({ ...props }) => <span {...props} />,
                          h1: ({ ...props }) => <h1 {...props} className="mt-2 mb-2 text-2xl font-bold" />,
                          h2: ({ ...props }) => <h2 {...props} className="mt-2 mb-2 text-xl font-bold" />,
                          h3: ({ ...props }) => <h3 {...props} className="mt-2 mb-2 text-lg font-bold" />,
                          p: ({ ...props }) => <p {...props} className="text-gray-100" />,
                          ul: ({ ...props }) => <ul {...props} className="list-disc ml-6 text-gray-100" />,
                          ol: ({ ...props }) => <ol {...props} className="list-decimal ml-6 text-gray-100" />,
                          li: ({ ...props }) => <li {...props} className="text-gray-100" />,
                        }}
                      >
                        {qa.answer}
                      </ReactMarkdown>
                    ) : (
                      <button
                        className="flex items-center mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handleUnlock(index)}
                      >
                        Unlock Answer&nbsp;
                        <span className="flex items-center ml-2">
                          5
                          <img src={Assets.coin_icon} className="w-auto h-5 ml-1 inline-block text-white align-middle" />
                        </span>
                      </button>
                    )}
                  </div>
                  {qa.tag && <p className="mt-1 text-sm text-gray-400">Tag: {qa.tag}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selectedPaper && (
        <button onClick={handleClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Papers
        </button>
      )}
    </div>
  );
};

export default QuestionList;

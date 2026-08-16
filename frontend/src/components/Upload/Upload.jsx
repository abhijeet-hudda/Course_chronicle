import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { uploadPaperApi } from "../../api/question.api";

function Upload() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      if (file.type === "application/pdf") {
        setPreview({ type: "pdf", url: URL.createObjectURL(file) });
      } else if (file.type.startsWith("image/")) {
        setPreview({ type: "image", url: URL.createObjectURL(file) });
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image) return;

    setResult("");

    const formData = new FormData();
    formData.append("file", image);

    try {
      const envelope = await uploadPaperApi(formData);
      setResult(envelope.message);
      toast.success(envelope.message);

      setTimeout(() => navigate("/"), 5000);
    } catch (error) {
      const message = error.response?.data?.message || "Error occurred, please try again later";
      console.error("Upload error:", error);
      setResult(message);
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Questions</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md space-y-4 transition-all"
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleImageChange}
          disabled={Boolean(result)}
          className={`
            w-full text-sm text-gray-400
            file:py-2 file:px-4 file:rounded-lg file:font-semibold
            file:border-0 file:text-white file:transition-all file:duration-300
            file:cursor-pointer
            ${result ? "file:bg-gray-500 file:cursor-not-allowed" : "file:bg-blue-600 hover:file:bg-blue-700"}
          `}
        />

        {preview && (
          <div className="flex justify-center mt-4 w-full">
            {preview.type === "image" && (
              <img
                src={preview.url}
                alt="Preview"
                className="w-48 h-48 rounded-lg shadow-lg object-cover border border-gray-700"
              />
            )}
            {preview.type === "pdf" && (
              <iframe
                src={preview.url + "#toolbar=0"}
                title="PDF Preview"
                className="w-64 h-80 border border-gray-700 rounded"
                frameBorder="0"
              />
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={Boolean(result)}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 text-white ${
            result ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Submit
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <div className="flex items-start">
            {result.toLowerCase().includes("processing") || result.toLowerCase().includes("submitted") ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-1 mt-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <p className="text-gray-300 ml-2">{result}</p>
              </>
            ) : (
              <p className="text-gray-300">{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;

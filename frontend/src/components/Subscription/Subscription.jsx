import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { updateCredit } from "../../store/authSlice";
import { makePaymentApi, validatePaymentApi } from "../../api/payment.api";

export default function Subscription() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const [isScriptLoaded, setIsScriptLoaded] = useState(() => Boolean(window.Razorpay));

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error("Razorpay SDK failed to load.");
      toast.error("Could not load payment gateway. Please check your connection and try again.");
    };
    document.body.appendChild(script);
  }, []);

  const paymentHandler = async (e) => {
    e.preventDefault();

    if (!auth.isLoggedIn) {
      toast.error("Please log in or sign up to make a purchase.");
      navigate("/signup", { state: { from: location } });
      return;
    }

    if (!isScriptLoaded) {
      toast.error("Payment gateway is still loading. Please wait a moment and try again.");
      return;
    }

    try {
      const envelope = await makePaymentApi({
        amount: 499 * 100, // amount in paise
        currency: "INR",
        receipt: `receipt_user_${auth.userId}`,
      });
      initializeRazorpay(envelope.data);
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Could not initiate payment. Please try again later.");
    }
  };

  const initializeRazorpay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Xamgen",
      description: "Credits Purchase",
      order_id: order.id,
      handler: async function (response) {
        try {
          const validateEnvelope = await validatePaymentApi(response);
          toast.success("Payment successful! Your credit balance has been updated.");
          dispatch(updateCredit(validateEnvelope.data.credit));
        } catch (error) {
          console.error("Error validating payment:", error);
          toast.error("Your payment was successful, but there was an error updating your account. Please contact support.");
        }
      },
      prefill: {
        name: auth.name,
        email: auth.email,
      },
      notes: {
        userId: auth.userId,
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp1 = new window.Razorpay(options);

    rzp1.on("payment.failed", function (response) {
      console.error("Razorpay payment failed:", response.error);
      toast.error(`Payment failed: ${response.error.description}`);
    });

    rzp1.open();
  };

  return (
    <section className="bg-white dark:bg-gray-900 mt-10">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Unlock Knowledge with Credits
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
            Get access to expert-verified answers by using credits. Purchase credits and explore a world of valuable knowledge.
          </p>
        </div>
        <div className="space-y-8 sm:gap-6 xl:gap-10 lg:space-y-0">
          <div className="flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
            <h3 className="mb-4 text-2xl font-semibold">Credit Plan</h3>
            <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
              Purchase credits to unlock answers and enhance your learning experience.
            </p>
            <div className="flex justify-center items-baseline my-8">
              <span className="mr-2 text-5xl font-extrabold">₹500</span>
              <span className="text-gray-500 dark:text-gray-400">for 10,000 Credits</span>
            </div>
            <ul role="list" className="mb-8 space-y-4 text-left">
              <li className="flex items-center space-x-3">
                <span>Each answer unlocks with credits</span>
              </li>
              <li className="flex items-center space-x-3">
                <span>No hidden fees, pay only for what you use</span>
              </li>
            </ul>
            <button
              onClick={paymentHandler}
              className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:text-white dark:focus:ring-blue-900"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

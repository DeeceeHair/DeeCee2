import React, { useState } from "react";
import axios from "axios";

const Payment: React.FC = () => {
  const [amount, setAmount] = useState<number>(100); // Default ₹100
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handlePayment = async () => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // ✅ Send amount to backend
      const { data } = await axios.post("http://localhost:5000/api/phonepe/pay", {
        amount,
      });

      // ✅ Backend returns redirect URL from PhonePe
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl; // Redirect to PhonePe checkout page
      } else {
        setMessage("Unable to start payment. Please try again.");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setMessage("Payment initiation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-purple-700 text-center mb-6">
          Pay Using PhonePe
        </h2>

        <label className="block text-gray-700 mb-2 font-medium">
          Enter Amount (₹)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount in INR"
          className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {loading ? "Processing..." : `Pay ₹${amount}`}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Payment;

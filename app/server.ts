// server.ts (or server.tsx)
import express, { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import cors from "cors";

// ----------------------------------------
// Express app setup
// ----------------------------------------
const app = express();
app.use(express.json());
app.use(cors());

// ----------------------------------------
// PhonePe credentials (replace with real values)
// ----------------------------------------
const MERCHANT_ID = "SU2510141550286609332406";
const SALT_KEY = "46d5c450-da73-496d-887d-ef34991804a2";
const BASE_URL = "https://api-preprod.phonepe.com/apis/hermes"; // Sandbox URL for testing

// ----------------------------------------
// Route: Initiate Payment
// ----------------------------------------
app.post("/api/phonepe/pay", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // Unique transaction ID
    const transactionId = "TXN_" + Date.now();

    // Payment payload
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      amount: amount * 100, // Convert to paise
      redirectUrl: `http://localhost:5000/api/phonepe/status/${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `http://localhost:5000/api/phonepe/status/${transactionId}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Convert to Base64
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");

    // Generate checksum (X-VERIFY)
    const checksum = crypto
      .createHash("sha256")
      .update(data + "/pg/v1/pay" + SALT_KEY)
      .digest("hex");
    const finalChecksum = checksum + "###1";

    // Send request to PhonePe API
    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      { request: data },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": finalChecksum,
          accept: "application/json",
        },
      }
    );

    // Extract redirect URL
    const redirectUrl = response.data.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      return res.status(500).json({ error: "Failed to get redirect URL" });
    }

    res.json({ redirectUrl });
  } catch (error: any) {
    console.error("Payment initiation failed:", error.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// ----------------------------------------
// Optional: Payment Status Verification
// ----------------------------------------
app.get("/api/phonepe/status/:transactionId", async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  try {
    const urlPath = `/pg/v1/status/${MERCHANT_ID}/${transactionId}`;
    const checksum = crypto
      .createHash("sha256")
      .update(urlPath + SALT_KEY)
      .digest("hex");
    const finalChecksum = checksum + "###1";

    const response = await axios.get(`${BASE_URL}${urlPath}`, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": finalChecksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
    });

    const status = response.data.data?.state || "UNKNOWN";
    res.send(`<h1>Payment ${status}</h1>`);
  } catch (error) {
    console.error("Status check failed:", error);
    res.status(500).send("<h1>Failed to verify payment</h1>");
  }
});

// ----------------------------------------
// Start server
// ----------------------------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

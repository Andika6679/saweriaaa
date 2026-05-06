// =============================================
// server.js — Webhook receiver dari Saweria
// Jalankan: node server.js
// Butuh: npm install express
// =============================================

const express = require("express");
const app = express();
app.use(express.json());

// Simpan donasi pending (Roblox akan polling ke sini)
let pendingDonations = [];

// ✅ Endpoint yang didaftarkan ke Saweria sebagai webhook URL
// URL kamu: https://domain-kamu.com/saweria-webhook
app.post("/saweria-webhook", (req, res) => {
  const data = req.body;

  console.log("[Saweria] Donasi masuk:", data);

  // Format data dari Saweria
  const donation = {
    id: data.id || Date.now().toString(),
    donatur: data.donator_name || "Anonim",
    jumlah: data.amount || 0,
    pesan: data.message || "",
    waktu: new Date().toISOString(),
  };

  pendingDonations.push(donation);

  // Batasi antrian maks 50
  if (pendingDonations.length > 50) {
    pendingDonations = pendingDonations.slice(-50);
  }

  res.json({ status: "ok" });
});

// ✅ Endpoint polling untuk Roblox (dipanggil dari HttpService)
// Roblox akan GET ke /roblox-poll setiap beberapa detik
app.get("/roblox-poll", (req, res) => {
  const secret = req.headers["x-roblox-secret"];

  if (secret !== process.env.ROBLOX_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const toSend = [...pendingDonations];
  pendingDonations = [];

  res.json({ donations: toSend });
});

// ✅ Health check
app.get("/", (req, res) => res.send("Saweria x Roblox Webhook OK!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));

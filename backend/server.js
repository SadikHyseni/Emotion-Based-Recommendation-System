
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch"); 

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}



// 🔹 Upload Screenshot Route
app.post("/upload", (req, res) => {
    try {
        const { image, video_id } = req.body;

        // Validate input
        if (!image || !video_id) {
            return res.status(400).send({ message: "❌ Missing image or video_id" });
        }

        // Create filename with video_id and timestamp
        let timestamp = Date.now();
        let fileName = `${video_id}_${timestamp}.png`;
        let filePath = path.join(screenshotsDir, fileName);

        // Save the image
        let imageData = image.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(filePath, imageData, "base64");

        console.log(`✅ Screenshot saved: ${fileName}`);

        res.status(200).send({ message: "✅ Image received", path: filePath, filename: fileName });
    } catch (error) {
        console.error("❌ Error saving image:", error);
        res.status(500).send({ message: "Error saving image" });
    }
});


// 🔹 Receive Video ID & Fetch Captions
app.post("/video_id", async (req, res) => {
    const { video_id } = req.body;

    if (!video_id) {
        return res.status(400).send({ message: "❌ No video ID received" });
    }

    console.log("📩 Received Video ID:", video_id);

    res.status(200).send({ video_id});
});

// 🔹 Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});



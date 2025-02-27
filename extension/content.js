// Prevent multiple injections
if (!window.isScriptLoaded) {
    window.isScriptLoaded = true;
    console.log("🔍 YouTube Auto Screenshot Script Loaded...");

    let capturing = true; // Auto-start capturing
    let videoStatus = "unknown"; // "playing", "paused", or "unknown"
    let captureInterval = null;
    let videoElement = null;
    let lastVideoId = ""; // Store last detected video ID for reuse

    // Function to extract the video ID from the URL
    function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("v"); // Extract video ID from URL
    }

    // Capture Screenshot
    function captureScreenshot() {
        if (!videoElement) {
            console.log("❌ No video found, waiting...");
            return;
        }

        // Reuse the last detected video ID
        let videoId = getVideoId();
        if (videoId) {
            lastVideoId = videoId;
        }

        if (!lastVideoId) {
            console.log("❌ No video ID found, skipping screenshot.");
            return;
        }

        let canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        let ctx = canvas.getContext("2d");

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        let imageData = canvas.toDataURL("image/png");

        console.log("📸 Screenshot captured! Sending to backend...");
        console.log("🆔 Video ID:", lastVideoId);

        // Debug: Check if imageData and videoId are valid
        if (!imageData || !lastVideoId) {
            console.error("❌ Missing image data or video ID. Skipping upload.");
            return;
        }

        fetch("http://localhost:5000/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData, video_id: lastVideoId })
        })
        .then(response => response.json())
        .then(data => console.log("✅ Screenshot sent successfully:", data))
        .catch(error => console.error("❌ Error sending screenshot:", error));
    }

    // Start Screenshot Loop
    function startScreenshotLoop() {
        if (!captureInterval && capturing) {
            console.log("▶️ Video is playing! Resuming screenshot capture...");
            captureScreenshot();
            captureInterval = setInterval(() => {
                console.log("⏳ Taking another screenshot...");
                captureScreenshot();
            }, 5000);
        }
    }

    // Stop Screenshot Loop
    function stopScreenshotLoop() {
        if (captureInterval) {
            console.log("⏸ Video is paused! Stopping screenshot capture...");
            clearInterval(captureInterval);
            captureInterval = null;
        }
    }

    // Monitor Video State Using MutationObserver
    function monitorVideoChanges() {
        const observer = new MutationObserver(() => {
            let newVideo = document.querySelector("video.html5-main-video"); // More specific selector
            let videoId = getVideoId();

            // Store video ID for reuse
            if (videoId) {
                lastVideoId = videoId;
            }

            if (newVideo && newVideo !== videoElement) {
                console.log("🔄 New video detected! Updating event listeners.");
                videoElement = newVideo;
                observeVideoState();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Detect Play/Pause Events
    function observeVideoState() {
        if (!videoElement) return;

        videoElement.addEventListener("play", () => {
            videoStatus = "playing";
            console.log("▶️ Video started playing!");
            startScreenshotLoop();
        });

        videoElement.addEventListener("pause", () => {
            videoStatus = "paused";
            console.log("⏸ Video is paused!");
            stopScreenshotLoop();
        });

        videoElement.addEventListener("ended", () => {
            videoStatus = "paused";
            console.log("⏹ Video ended!");
            stopScreenshotLoop();
        });

        console.log("🎥 Video event listeners attached.");
    }

    // Force Start Capturing
    function waitForVideoElement() {
        console.log("🔍 Waiting for video element...");
        let checkVideoInterval = setInterval(() => {
            videoElement = document.querySelector("video.html5-main-video");
            if (videoElement) {
                console.log("✅ Video element found:", videoElement);
                clearInterval(checkVideoInterval);
                observeVideoState();
                startScreenshotLoop(); // Start capturing once the video is detected
            }
        }, 1000); // Check every 1 second
    }

    // Start Monitoring
    waitForVideoElement();
    monitorVideoChanges();
    console.log("🚀 Monitoring YouTube video changes...");
}



// if (!window.isScriptLoaded) {
// console.log("🔍 YouTube Auto Screenshot Loaded...");

// let capturing = false;
// let videoStatus = "unknown"; // "playing", "paused", or "unknown"
// let captureInterval = null;
// let videoElement = null;
// let lastVideoId = "";

// // Function to extract the video ID from the URL
// function getVideoId() {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get("v"); // Extract video ID from URL
// }

// // Function to send video ID to backend
// function sendVideoIdToBackend(videoId) {
//     if (!videoId || videoId === lastVideoId) {
//         return; // Skip if it's the same video ID to avoid redundant calls
//     }

//     console.log("📡 Sending video ID to backend:", videoId);
//     fetch("http://localhost:5000/video_id", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ video_id: videoId })
//     })
//     .then(response => response.json())
//     .then(data => console.log("✅ Backend response:", data))
//     .catch(error => console.error("❌ Error sending video ID:", error));

//     lastVideoId = videoId; // Store last sent video ID to prevent duplicates
// }

// // Capture Screenshot
// function captureScreenshot() {
//     if (!videoElement) {
//         console.log("❌ No video found, waiting...");
//         return;
//     }

//     let canvas = document.createElement("canvas");
//     canvas.width = videoElement.videoWidth;
//     canvas.height = videoElement.videoHeight;
//     let ctx = canvas.getContext("2d");

//     ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//     let imageData = canvas.toDataURL("image/png");

//     console.log("📸 Screenshot captured! Sending to backend...");

//     fetch("http://localhost:5000/upload", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image: imageData })
//     })
//     .then(response => response.json())
//     .then(data => console.log("✅ Screenshot sent successfully:", data))
//     .catch(error => console.error("❌ Error sending screenshot:", error));
// }


// // Start Screenshot Loop
// function startScreenshotLoop() {
//     if (!captureInterval && capturing) {
//         console.log("▶️ Video is playing! Resuming screenshot capture...");
//         captureScreenshot();
//         captureInterval = setInterval(() => {
//             console.log("⏳ Taking another screenshot...");
//             captureScreenshot();
//         }, 5000);
//     }
// }

// // Stop Screenshot Loop
// function stopScreenshotLoop() {
//     if (captureInterval) {
//         console.log("⏸ Video is paused! Stopping screenshot capture...");
//         clearInterval(captureInterval);
//         captureInterval = null;
//     }
// }

// // Monitor Video State Using MutationObserver
// function monitorVideoChanges() {
//     const observer = new MutationObserver(() => {
//         let newVideo = document.querySelector("video");
//         let videoId = getVideoId();

//         if (videoId) {
//             sendVideoIdToBackend(videoId); // Send video ID for captions
//         }

//         if (newVideo && newVideo !== videoElement) {
//             console.log("🔄 New video detected! Updating event listeners.");
//             videoElement = newVideo;
//             observeVideoState();
//         }
//     });

//     observer.observe(document.body, { childList: true, subtree: true });
// }

// // Detect Play/Pause Events
// function observeVideoState() {
//     if (!videoElement) return;

//     videoElement.addEventListener("play", () => {
//         videoStatus = "playing";
//         console.log("▶️ Video started playing!");
//         if (capturing) startScreenshotLoop();
//     });

//     videoElement.addEventListener("pause", () => {
//         videoStatus = "paused";
//         console.log("⏸ Video is paused!");
//         stopScreenshotLoop();
//     });

//     videoElement.addEventListener("ended", () => {
//         videoStatus = "paused";
//         console.log("⏹ Video ended!");
//         stopScreenshotLoop();
//     });

//     console.log("🎥 Video event listeners attached.");
// }


// // Stop Script When YouTube Tab is Closed
// function stopWhenTabClosed() {
//     window.addEventListener("beforeunload", () => {
//         console.log("🚨 YouTube tab closed! Stopping all operations...");
//         clearInterval(captureInterval);
//         captureInterval = null;
//     });
// }

//     // Force Start Capturing
//     function waitForVideoElement() {
//         console.log("🔍 Waiting for video element...");
//         let checkVideoInterval = setInterval(() => {
//             videoElement = document.querySelector("video.html5-main-video");
//             if (videoElement) {
//                 console.log("✅ Video element found:", videoElement);
//                 clearInterval(checkVideoInterval);
//                 observeVideoState();
//                 startScreenshotLoop(); // Start capturing once the video is detected
//             }
//         }, 1000); // Check every 1 second
//     }

//     //start Monitoring
// waitForVideoElement();
// monitorVideoChanges();
// stopWhenTabClosed();
// console.log("🚀 Monitoring YouTube video changes...");

// }


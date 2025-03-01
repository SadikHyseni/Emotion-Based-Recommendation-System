// Prevent multiple injections
if (!window.isScriptLoaded) {
    window.isScriptLoaded = true;
    console.log("🔍 YouTube Auto Screenshot Script Loaded...");

    let capturing = true;
    let videoStatus = "unknown";
    let captureInterval = null;
    let videoElement = null;
    let lastVideoId = "";
    let userVideo = null;

    // ✅ Ensure face-api.js is properly loaded
    function waitForFaceAPI() {
        return new Promise((resolve, reject) => {
            if (window.faceapi) {
                console.log("✅ Face API already loaded.");
                resolve();
            } else {
                console.error("❌ Face API not found.");
                reject("Face API not loaded.");
            }
        });
    }

    // ✅ Load Face Detection Models from Local Files
    async function loadModels() {
        try {
            console.log("🚀 Loading face-api.js models...");

            await faceapi.nets.tinyFaceDetector.loadFromUri(chrome.runtime.getURL("models/"));
            await faceapi.nets.faceExpressionNet.loadFromUri(chrome.runtime.getURL("models/"));

            console.log("✅ Face-api.js Models Loaded.");
        } catch (error) {
            console.error("❌ Error loading face-api.js models:", error);
        }
    }

    // ✅ Request Camera Access
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            userVideo = document.createElement("video");
            userVideo.srcObject = stream;
            userVideo.play();
            console.log("🎥 Camera access granted.");
        } catch (error) {
            console.error("❌ Camera access denied:", error);
        }
    }

    // ✅ Capture Screenshot and Analyze Emotions
    async function captureScreenshot() {
        if (!videoElement) {
            console.log("❌ No video found.");
            return;
        }

        let videoId = new URLSearchParams(window.location.search).get("v");
        if (videoId) lastVideoId = videoId;

        if (!lastVideoId) {
            console.log("❌ No video ID found.");
            return;
        }

        let canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        let ctx = canvas.getContext("2d");

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        let imageData = canvas.toDataURL("image/png");

        // ✅ Detect Emotions
        if (userVideo) {
            const faceDetections = await faceapi
                .detectAllFaces(userVideo, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (faceDetections.length > 0) {
                const emotions = faceDetections[0].expressions;
                console.log("😃 Detected Emotions:", emotions);

                fetch("http://localhost:5000/emotions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emotions, video_id: lastVideoId })
                })
                .then(response => response.json())
                .then(data => console.log("✅ Emotions sent successfully:", data))
                .catch(error => console.error("❌ Error sending emotions:", error));
            }
        }

        console.log("📸 Screenshot captured! Sending to backend...");

        fetch("http://localhost:5000/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData, video_id: lastVideoId })
        })
        .then(response => response.json())
        .then(data => console.log("✅ Screenshot sent successfully:", data))
        .catch(error => console.error("❌ Error sending screenshot:", error));
    }

    // ✅ Start Screenshot Capture
    function startScreenshotLoop() {
        if (!captureInterval && capturing) {
            console.log("▶️ Video is playing! Capturing...");
            captureScreenshot();
            captureInterval = setInterval(() => {
                captureScreenshot();
            }, 5000);
        }
    }

    // ✅ Stop Screenshot Capture
    function stopScreenshotLoop() {
        if (captureInterval) {
            console.log("⏸ Video is paused.");
            clearInterval(captureInterval);
            captureInterval = null;
        }
    }

    // ✅ Monitor Video Changes
    function monitorVideoChanges() {
        const observer = new MutationObserver(() => {
            let newVideo = document.querySelector("video.html5-main-video");
            let videoId = new URLSearchParams(window.location.search).get("v");

            if (videoId) lastVideoId = videoId;

            if (newVideo && newVideo !== videoElement) {
                console.log("🔄 New video detected.");
                videoElement = newVideo;
                observeVideoState();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ✅ Observe Video State
    function observeVideoState() {
        if (!videoElement) return;

        videoElement.addEventListener("play", () => {
            console.log("▶️ Video playing.");
            startScreenshotLoop();
        });

        videoElement.addEventListener("pause", () => {
            console.log("⏸ Video paused.");
            stopScreenshotLoop();
        });

        videoElement.addEventListener("ended", () => {
            console.log("⏹ Video ended.");
            stopScreenshotLoop();
        });
    }

    // ✅ Start Everything
    async function init() {
        try {
            await waitForFaceAPI();
            await loadModels();
            await startCamera();
            let checkVideoInterval = setInterval(() => {
                videoElement = document.querySelector("video.html5-main-video");
                if (videoElement) {
                    clearInterval(checkVideoInterval);
                    observeVideoState();
                    startScreenshotLoop();
                }
            }, 1000);
            monitorVideoChanges();
        } catch (error) {
            console.error("❌ Error initializing script:", error);
        }
    }

    init();
}




// // Prevent multiple injections
// if (!window.isScriptLoaded) {
//     window.isScriptLoaded = true;
//     console.log("🔍 YouTube Auto Screenshot Script Loaded...");
  
//     let capturing = true;
//     let videoStatus = "unknown";
//     let captureInterval = null;
//     let videoElement = null;
//     let lastVideoId = "";
//     let userVideo = null;
  
//     // Inject face-api.js dynamically
//     function injectFaceAPI() {
//       return new Promise((resolve, reject) => {
//         const script = document.createElement("script");
//         script.src = chrome.runtime.getURL("libs/face-api.min.js"); // Load from extension directory
//         script.onload = () => {
//           console.log("✅ Face API loaded successfully.");
//           resolve();
//         };
//         script.onerror = () => {
//           console.error("❌ Failed to load Face API.");
//           reject(new Error("Face API failed to load"));
//         };
//         document.head.appendChild(script);
//       });
//     }
  
//     // Load face-api.js Models
//     async function loadModels() {
//       const modelPath = chrome.runtime.getURL("models/");
//       await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
//       await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
//       console.log("✅ Face-api.js Models Loaded from local directory.");
//     }
  
//     // Request Camera Access & Start Stream
//     async function startCamera() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         userVideo = document.createElement("video");
//         userVideo.srcObject = stream;
//         userVideo.muted = true;
//         userVideo.playsInline = true;
//         await userVideo.play();
//         console.log("🎥 Camera access granted, streaming started.");
//       } catch (error) {
//         console.error("❌ Camera access denied:", error);
//       }
//     }
  
//     // Function to extract the video ID from the URL
//     function getVideoId() {
//       const urlParams = new URLSearchParams(window.location.search);
//       return urlParams.get("v");
//     }
  
//     // Capture Screenshot
//     async function captureScreenshot() {
//       if (!videoElement) {
//         console.log("❌ No video found, waiting...");
//         return;
//       }
  
//       let videoId = getVideoId();
//       if (videoId) {
//         lastVideoId = videoId;
//       }
  
//       if (!lastVideoId) {
//         console.log("❌ No video ID found, skipping screenshot.");
//         return;
//       }
  
//       let canvas = document.createElement("canvas");
//       canvas.width = videoElement.videoWidth;
//       canvas.height = videoElement.videoHeight;
//       let ctx = canvas.getContext("2d");
  
//       ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//       let imageData = canvas.toDataURL("image/png");
  
//       // Detect Emotions
//       if (userVideo && userVideo.readyState >= 2) {
//         const faceDetections = await faceapi
//           .detectAllFaces(userVideo, new faceapi.TinyFaceDetectorOptions())
//           .withFaceExpressions();
  
//         if (faceDetections.length > 0) {
//           const emotions = faceDetections[0].expressions;
//           console.log("😃 Detected Emotions:", emotions);
  
//           fetch("http://localhost:5000/emotions", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ emotions, video_id: lastVideoId }),
//           })
//             .then((response) => response.json())
//             .then((data) => console.log("✅ Emotions sent successfully:", data))
//             .catch((error) => console.error("❌ Error sending emotions:", error));
//         }
//       }
  
//       console.log("📸 Screenshot captured! Sending to backend...");
//       console.log("🆔 Video ID:", lastVideoId);
  
//       if (!imageData || !lastVideoId) {
//         console.error("❌ Missing image data or video ID. Skipping upload.");
//         return;
//       }
  
//       fetch("http://localhost:5000/upload", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image: imageData, video_id: lastVideoId }),
//       })
//         .then((response) => response.json())
//         .then((data) => console.log("✅ Screenshot sent successfully:", data))
//         .catch((error) => console.error("❌ Error sending screenshot:", error));
//     }
  
//     // Start Screenshot Loop
//     function startScreenshotLoop() {
//       if (!captureInterval && capturing) {
//         console.log("▶️ Video is playing! Resuming screenshot capture...");
//         captureScreenshot();
//         captureInterval = setInterval(() => {
//           console.log("⏳ Taking another screenshot...");
//           captureScreenshot();
//         }, 5000);
//       }
//     }
  
//     // Stop Screenshot Loop
//     function stopScreenshotLoop() {
//       if (captureInterval) {
//         console.log("⏸ Video is paused! Stopping screenshot capture...");
//         clearInterval(captureInterval);
//         captureInterval = null;
//       }
//     }
  
//     // Monitor Video State Using MutationObserver
//     function monitorVideoChanges() {
//       const observer = new MutationObserver(() => {
//         let newVideo = document.querySelector("video.html5-main-video");
//         let videoId = getVideoId();
  
//         if (videoId) {
//           lastVideoId = videoId;
//         }
  
//         if (newVideo && newVideo !== videoElement) {
//           console.log("🔄 New video detected! Updating event listeners.");
//           videoElement = newVideo;
//           observeVideoState();
//         }
//       });
  
//       observer.observe(document.body, { childList: true, subtree: true });
//     }
  
//     // Detect Play/Pause Events
//     function observeVideoState() {
//       if (!videoElement) return;
  
//       videoElement.addEventListener("play", () => {
//         videoStatus = "playing";
//         console.log("▶️ Video started playing!");
//         startScreenshotLoop();
//       });
  
//       videoElement.addEventListener("pause", () => {
//         videoStatus = "paused";
//         console.log("⏸ Video is paused!");
//         stopScreenshotLoop();
//       });
  
//       videoElement.addEventListener("ended", () => {
//         videoStatus = "paused";
//         console.log("⏹ Video ended!");
//         stopScreenshotLoop();
//       });
  
//       console.log("🎥 Video event listeners attached.");
//     }
  
//     injectFaceAPI()
//       .then(() => loadModels())
//       .then(() => startCamera())
//       .then(() => {
//         waitForVideoElement();
//         monitorVideoChanges();
//         console.log("🚀 Monitoring YouTube video changes...");
//       })
//       .catch((error) => console.error("❌ Error loading models or camera:", error));
//   }





// // Prevent multiple injections
// if (!window.isScriptLoaded) {
//   window.isScriptLoaded = true;
//   console.log("🔍 YouTube Auto Screenshot Script Loaded...");

//   let capturing = true;
//   let videoStatus = "unknown";
//   let captureInterval = null;
//   let videoElement = null;
//   let lastVideoId = "";
//   let userVideo = null;

//   // Inject face-api.js dynamically
//   function injectFaceAPI() {
//     return new Promise((resolve, reject) => {
//       const script = document.createElement("script");
//       script.src = chrome.runtime.getURL("libs/face-api.min.js"); // Load from extension directory
//       script.onload = () => {
//         console.log("✅ Face API loaded successfully.");
//         resolve();
//       };
//       script.onerror = () => {
//         console.error("❌ Failed to load Face API.");
//         reject(new Error("Face API failed to load"));
//       };
//       document.head.appendChild(script);
//     });
//   }

//   // Load face-api.js Models
//   async function loadModels() {
//     const modelPath = chrome.runtime.getURL("models/");
//     await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
//     await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
//     console.log("✅ Face-api.js Models Loaded from local directory.");
//   }

//   // Request Camera Access & Start Stream
//   async function startCamera() {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       userVideo = document.createElement("video");
//       userVideo.srcObject = stream;
//       userVideo.muted = true;
//       userVideo.playsInline = true;
//       await userVideo.play();
//       console.log("🎥 Camera access granted, streaming started.");
//     } catch (error) {
//       console.error("❌ Camera access denied:", error);
//     }
//   }

//   // Function to extract the video ID from the URL
//   function getVideoId() {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get("v");
//   }

//   // Capture Screenshot
//   async function captureScreenshot() {
//     if (!videoElement) {
//       console.log("❌ No video found, waiting...");
//       return;
//     }

//     let videoId = getVideoId();
//     if (videoId) {
//       lastVideoId = videoId;
//     }

//     if (!lastVideoId) {
//       console.log("❌ No video ID found, skipping screenshot.");
//       return;
//     }

//     let canvas = document.createElement("canvas");
//     canvas.width = videoElement.videoWidth;
//     canvas.height = videoElement.videoHeight;
//     let ctx = canvas.getContext("2d");

//     ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//     let imageData = canvas.toDataURL("image/png");

//     // Detect Emotions
//     if (userVideo && userVideo.readyState >= 2) {
//       const faceDetections = await faceapi
//         .detectAllFaces(userVideo, new faceapi.TinyFaceDetectorOptions())
//         .withFaceExpressions();

//       if (faceDetections.length > 0) {
//         const emotions = faceDetections[0].expressions;
//         console.log("😃 Detected Emotions:", emotions);

//         fetch("http://localhost:5000/emotions", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ emotions, video_id: lastVideoId }),
//         })
//           .then((response) => response.json())
//           .then((data) => console.log("✅ Emotions sent successfully:", data))
//           .catch((error) => console.error("❌ Error sending emotions:", error));
//       }
//     }

//     console.log("📸 Screenshot captured! Sending to backend...");
//     console.log("🆔 Video ID:", lastVideoId);

//     if (!imageData || !lastVideoId) {
//       console.error("❌ Missing image data or video ID. Skipping upload.");
//       return;
//     }

//     fetch("http://localhost:5000/upload", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ image: imageData, video_id: lastVideoId }),
//     })
//       .then((response) => response.json())
//       .then((data) => console.log("✅ Screenshot sent successfully:", data))
//       .catch((error) => console.error("❌ Error sending screenshot:", error));
//   }

//   // Start Screenshot Loop
//   function startScreenshotLoop() {
//     if (!captureInterval && capturing) {
//       console.log("▶️ Video is playing! Resuming screenshot capture...");
//       captureScreenshot();
//       captureInterval = setInterval(() => {
//         console.log("⏳ Taking another screenshot...");
//         captureScreenshot();
//       }, 5000);
//     }
//   }

//   // Stop Screenshot Loop
//   function stopScreenshotLoop() {
//     if (captureInterval) {
//       console.log("⏸ Video is paused! Stopping screenshot capture...");
//       clearInterval(captureInterval);
//       captureInterval = null;
//     }
//   }

//   // Monitor Video State Using MutationObserver
//   function monitorVideoChanges() {
//     const observer = new MutationObserver(() => {
//       let newVideo = document.querySelector("video.html5-main-video");
//       let videoId = getVideoId();

//       if (videoId) {
//         lastVideoId = videoId;
//       }

//       if (newVideo && newVideo !== videoElement) {
//         console.log("🔄 New video detected! Updating event listeners.");
//         videoElement = newVideo;
//         observeVideoState();
//       }
//     });

//     observer.observe(document.body, { childList: true, subtree: true });
//   }

//   // Detect Play/Pause Events
//   function observeVideoState() {
//     if (!videoElement) return;

//     videoElement.addEventListener("play", () => {
//       videoStatus = "playing";
//       console.log("▶️ Video started playing!");
//       startScreenshotLoop();
//     });

//     videoElement.addEventListener("pause", () => {
//       videoStatus = "paused";
//       console.log("⏸ Video is paused!");
//       stopScreenshotLoop();
//     });

//     videoElement.addEventListener("ended", () => {
//       videoStatus = "paused";
//       console.log("⏹ Video ended!");
//       stopScreenshotLoop();
//     });

//     console.log("🎥 Video event listeners attached.");
//   }

//   injectFaceAPI()
//     .then(() => loadModels())
//     .then(() => startCamera())
//     .then(() => {
//       waitForVideoElement();
//       monitorVideoChanges();
//       console.log("🚀 Monitoring YouTube video changes...");
//     })
//     .catch((error) => console.error("❌ Error loading models or camera:", error));
// }
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

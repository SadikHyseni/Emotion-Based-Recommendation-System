//Create a link element and appends it to the document head.
function createLinkElement(href, rel) {
  const link = document.createElement('link');
  link.href = href;
  link.rel = rel;
  document.head.appendChild(link);
}

//Create a style element and appends it to the document head.
function createStyleElement(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Load the Google Sans font by creating a link element.
function loadGoogleSansFont() {
  createLinkElement('https://fonts.googleapis.com/css?family=Google+Sans', 'stylesheet');
}

// Create the highlight style by creating a style element.
function createHighlightStyle() {
  const css = `
    .highlighted {
      background-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
    }
  `;
  createStyleElement(css);
}

// Initialize global styles by loading the font and creating the highlight style.
function initializeGlobalStyles() {
  loadGoogleSansFont();
  createHighlightStyle();
}

async function initializeUserVideo() {
  try {
    console.log("Requesting Camera Access...");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const userVideo = document.createElement("video");
    userVideo.classList.add("user-expression-video"); // Explicit identifier for observer
    userVideo.srcObject = stream;
    userVideo.setAttribute("autoplay", "");
    userVideo.setAttribute("playsinline", "");

        
        // Optional: Style Webcam Video
        Object.assign(userVideo.style, {
            position: "fixed",
            bottom: "10px",
            right: "10px",
            width: "200px",
            height: "150px",
            border: "2px solid #4285f4",
            zIndex: "9999"
        });

        document.body.appendChild(userVideo);
        console.log("Camera Access Granted, Recording Started...");

    } catch (error) {
        console.error("Camera Access Denied:", error);
    }
}


// Create and return the expressions table element, applying necessary styles.
function createExpressionsTable() {
  const table = document.createElement('table');
  table.id = 'expressionsTable';
  Object.assign(table.style, {
    position: 'fixed',           // Fix position to the top left
   right: '0',
    top: '70%',             // Vertically in the middle
    transform: 'translateY(-50%)', // Center table vertically
    zIndex: '101',               // Stack above other elements
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)', // Add shadow
    backgroundColor: 'rgba(255, 255, 255, 0.35)', // Semi-transparent white background
    padding: '10px',             // Padding around the table content
    borderRadius: '5px',         // Rounded corners
    fontFamily: "'Google Sans', sans-serif", // Google Sans font
  });
  document.body.appendChild(table);  // Add table to body of the document
  return table;
}

// Initialization logic for the face-api models.
async function initializeFaceApiModels() {
  const MODEL_URL = chrome.runtime.getURL('models/');
  await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
}

// Initialize an object to store the count of each expression globally
let globalExpressionsCount = {
  angry: 0,
  disgusted: 0,
  fearful: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  surprised: 0,
};
let globalTotalExpressions = 0;

let globalLastValidPercentages = {
  angry: '',
  disgusted: '',
  fearful: '',
  happy: '',
  neutral: '',
  sad: '',
  surprised: '',
};

function resetGlobalCounts() {
  globalExpressionsCount = {
    angry: 0,
    disgusted: 0,
    fearful: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprised: 0,
  };
  globalTotalExpressions = 0;
}

// Create and return the expressions table element, applying necessary styles.
function createExpressionsTable() {
  const table = document.createElement('table');
  table.id = 'expressionsTable';
  Object.assign(table.style, {
    position: 'fixed',           // Fix position to the top left
    right: '0',  // Left edge
    top: '70%',            // Vertically in the middle
    transform: 'translateY(-50%)', // Center table vertically
    zIndex: '101',               // Stack above other elements
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)', // Add shadow
    backgroundColor: 'rgba(255, 255, 255, 0.35)', // Semi-transparent white background
    padding: '10px',             // Padding around the table content
    borderRadius: '5px',         // Rounded corners
    fontFamily: "'Google Sans', sans-serif", // Google Sans font
  });
  document.body.appendChild(table);  // Add table to body of the document
  return table;
}

async function detectFaces(canvas, video) {
  //const rect = video.getBoundingClientRect();
  lastDetectionTime = Date.now();

  // Perform detection only if the video is visible
  if (await video_exists(video)) {
    // Perform face detection on the canvas using the face-api.js library
    const detections = await faceapi.detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options()).withFaceExpressions();

    if (detections.length > 0) {
      detections.forEach(detection => {
        const { expressions } = detection;
        // Increment the count for each expression with a score >= 0.5
        for (let expression in expressions) {
          if (expressions[expression] >= 0.5) {
            globalExpressionsCount[expression]++;
            globalTotalExpressions++;
          }
        }
      });
    }
  }
}

function updateUI(table) {
  table.innerHTML = '';

  let maxPercentage = -1;
  let maxRow = null;

  for (let expression in globalExpressionsCount) {
    const percentage = globalTotalExpressions > 0
      ? ((globalExpressionsCount[expression] / globalTotalExpressions) * 100).toFixed(2)
      : "0.00";

    globalLastValidPercentages[expression] = percentage + '%';

    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const countCell = document.createElement('td');

    nameCell.textContent = expression;
    countCell.textContent = `${percentage}%`;

    row.appendChild(nameCell);
    row.appendChild(countCell);
    table.appendChild(row);

    if (parseFloat(percentage) > maxPercentage) {
      maxPercentage = parseFloat(percentage);
      maxRow = row;
    }
  }

  highlightMaxRow(table, maxRow);
}

function highlightMaxRow(table, maxRow) {
  const rows = table.getElementsByTagName('tr');
  for (let row of rows) {
    row.classList.remove('highlighted');
  }

  if (maxRow) {
    maxRow.classList.add('highlighted');
    maxRow.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; 

  }
}



async function video_exists(video){
  const rect = video.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0){
    return true;
  }
  else{
    return false;
  }
}

async function position_canvas(video, canvas){
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.position = "absolute";
  canvas.style.left = rect.left + "px";
  canvas.style.top = rect.top + "px";
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, rect.width, rect.height);
}















// Extract YouTube Tags by Fetching Video Page Data
async function getYouTubeTags(videoId) {
  try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const text = await response.text();

      // Extract metadata script from the page
      const match = text.match(/"keywords":\["(.*?)"\]/);

      if (match && match[1]) {
          return match[1].split('","'); // Convert to an array of tags
      } else {
          console.warn("⚠️ No tags found for this video.");
          return [];
      }
  } catch (error) {
      console.error("❌ Error fetching tags:", error);
      return [];
  }
}

// Create Screenshot Function 
async function captureScreenshot(videoElement, videoId) {
  let canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  let imageData = canvas.toDataURL("image/png");

  // Collect facial expressions at the same time
  const expressionsData = getCurrentExpressionData();

  //Extract Youtube tags
  const videoTags = await getYouTubeTags(videoId);

  console.log("📸 Screenshot Captured & Emotion Data Collected! Sending to Backend...");
  console.log({
    video_id: videoId,
    timestamp: Date.now(),
    image: imageData.substring(0, 100) + "...", // Display only the start of the image data for readability
    expressions: expressionsData,
    YoutubeVideo_tags: videoTags,
});

  // Send both data points to the backend
  fetch("http://localhost:5000/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          Youtubeimage : imageData,
          video_id: videoId,
          UserEmotion_expressions: expressionsData,
          YoutubeVideo_tags: videoTags,
          timestamp: Date.now()
      })
  })
  .then(response => response.json())
  .then(data => console.log("✅ Screenshot & Data Sent Successfully:", data))
  .catch(error => console.error("❌ Error Sending Data:", error));
}

//emotion data capture
// Capture Current Expression Data
function getCurrentExpressionData() {
  return { ...globalLastValidPercentages };  // Copy the latest valid percentages
}



//video monitoring logic

let videoElement;
let lastVideoId = null;
let captureInterval = null;

// Monitor YouTube Video Changes
function monitorYouTubeVideoChanges() {
  const observer = new MutationObserver(() => {
      let newVideo = document.querySelector("video.html5-main-video");
      let videoId = new URLSearchParams(window.location.search).get("v");

      if (videoId) lastVideoId = videoId;

      if (newVideo && newVideo !== videoElement) {
          console.log("🔄 New YouTube Video Detected.");
          videoElement = newVideo;
          observeVideoState();
      }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Observe Video Play/Pause for Screenshot Capture
function observeVideoState() {
  if (!videoElement) return;

  videoElement.addEventListener("play", () => {
      console.log("▶️ YouTube Video Playing.");
      startScreenshotLoop();
  });

  videoElement.addEventListener("pause", () => {
      console.log("⏸ YouTube Video Paused.");
      stopScreenshotLoop();
  });

  videoElement.addEventListener("ended", () => {
      console.log("⏹ YouTube Video Ended.");
      stopScreenshotLoop();
  });
}

// Start Screenshot and Expression Data Loop
function startScreenshotLoop() {
  if (!captureInterval) {
      console.log("▶️ Capturing Screenshots & Expressions Every 5s...");
      captureScreenshot(videoElement, lastVideoId);  // Initial capture
      captureInterval = setInterval(() => {
          captureScreenshot(videoElement, lastVideoId);
      }, 5000);
  }
}

// Stop Screenshot and Expression Data Loop
function stopScreenshotLoop() {
  if (captureInterval) {
      console.log("⏸ Stopping Screenshot & Expression Capture.");
      clearInterval(captureInterval);
      captureInterval = null;
  }
}















































window.onload = async () => {
  await initializeFaceApiModels();

  // Map to store the canvas, table, and observers associated with each video element
  const videoMap = new Map();
  resetGlobalCounts(); // Reset the counts initially

  let lastDetectionTime = Date.now();

  // Create the table once and use it globally.
  const expressionsTable = createExpressionsTable();

  //Initialize webcam video 
  await initializeUserVideo();
  
  
  //reset the emotion every 3 seconds
  setInterval(() => {
    resetGlobalCounts(); // Reset the counts for the new interval
  }, 3000);



  // Function to update the canvas size and position and draw video onto canvas
  const updateCanvas = async (canvas, Video) => {

    if (Video) {
      await position_canvas(Video, canvas);
    }

    if (Date.now() - lastDetectionTime > 100) {
      await detectFaces(canvas, Video);
      updateUI(document.getElementById('expressionsTable'));
    }
    requestAnimationFrame(() => updateCanvas(canvas,Video)); // Keep animation frame loop running
  };

  // Create a new IntersectionObserver instance
  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Get the canvas and observers from the map
      const data = videoMap.get(entry.target);

      if (data) {
        // If the video element is not in the viewport or not visible
        if (!entry.isIntersecting) {
          // Remove the canvas and table from the body
          if (data.canvas.parentNode) {
            data.canvas.parentNode.removeChild(data.canvas);
            data.table.parentNode.removeChild(data.table); // Remove the table
          }
        } else {
          // Add the canvas and table to the body
          if (!data.canvas.parentNode) {
            document.body.appendChild(data.canvas);
            document.body.appendChild(data.table); // Add the table
          }
        }
      }
    });
  });

  // Specifically observe only the webcam video element
const observeUserVideo = () => {
  const userVideo = document.querySelector(".user-expression-video");
  if (!userVideo) {
    console.error("❌ User video not found!");
    return;
  }

  const canvas = document.createElement("canvas");
  const table = document.createElement("table");
  table.id = "expressionsTable";
  document.body.appendChild(canvas);
  document.body.appendChild(table);

  const resizeObserver = new ResizeObserver(() => {
    position_canvas(userVideo, canvas);
  });
  resizeObserver.observe(userVideo);

  const mutationObserver = new MutationObserver(() => {
    position_canvas(userVideo, canvas);
  });
  mutationObserver.observe(userVideo, { attributes: true });

  updateCanvas(canvas, userVideo);
};

observeUserVideo();

monitorYouTubeVideoChanges();

};


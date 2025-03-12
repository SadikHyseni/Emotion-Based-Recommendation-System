import { MongoClient } from 'mongodb';


const uri="mongodb+srv://SadikHyseni:gfqj2h3bgui34hIBFE@cluster0.77brf.mongodb.net/Emotion_Based_Recommendation_System?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db;

export async function connectDB() {
    try {
        await client.connect();
        db = client.db("emotionData");  // Database name
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
}

export async function saveEmotionData(emotionData) {
    const collection = db.collection("emotions");
    await collection.insertOne(emotionData);
    console.log(`📥 Emotion data saved successfully at ${emotionData.timestamp}`);
}

export async function saveImageData(imageURL, timestamp) {
    const collection = db.collection("screenshots");
    await collection.insertOne({ imageURL: imageURL, timestamp: timestamp });
    console.log(`🖼️ Screenshot URL saved at ${timestamp}`);
}

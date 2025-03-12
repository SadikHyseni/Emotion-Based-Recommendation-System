const express = require('express');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');  // AWS SDK v3
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for JSON data (with larger size for image data)
app.use(express.json({ limit: '10mb' }));


//  AWS SDK v3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

//Mongodb
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const dataSchema = new mongoose.Schema({
    video_id: String,
    timestamp: Number,
    expressions: Object,
    tags: [String],
    s3_image_key: [String]
}, { timestamps: true });

const Data = mongoose.model('Data', dataSchema);

//upload to S3  
async function uploadToS3(imageData, videoId, timestamp) {
    const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${videoId}_${timestamp}.png`,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/png'
    };

    try {
        await s3.send(new PutObjectCommand(params));
        console.log(`✅ Image uploaded successfully: ${params.Key}`);
        return params.Key;  // Return the S3 key for MongoDB reference
    } catch (error) {
        console.error('❌ Error uploading to S3:', error);
        throw error;
    }
}

//api entpoint
app.post('/api/upload', async (req, res) => {
    const { image, video_id, expressions, tags, timestamp } = req.body;

    if (!image || !video_id || !timestamp) {
        return res.status(400).json({ error: 'Missing required fields (image, video_id, timestamp)' });
    }

    try {
        // Upload image to S3 asynchronously
        const s3ImageKey = await uploadToS3(image, video_id, timestamp);

        // Check if data for this video + timestamp already exists (prevent duplicates)
        const existingEntry = await Data.findOne({ video_id, timestamp });

        if (existingEntry) {
            // Update existing entry (since data is continuous)
            await Data.updateOne(
                { video_id, timestamp },
                {
                    $set: { expressions, tags },
                    $push: { s3_image_key: s3ImageKey }  // Append new image references
                }
            );
            console.log('✅ Existing entry updated successfully in MongoDB.');
        } else {
            // Create a new entry
            const newData = new Data({
                video_id,
                timestamp,
                expressions,
                tags,
                s3_image_key: [s3ImageKey]
            });

            await newData.save();
            console.log('✅ New metadata saved successfully in MongoDB.');
        }

        res.status(200).json({ success: true, message: "Data uploaded successfully!" });
    } catch (error) {
        console.error('❌ Error uploading data:', error);
        res.status(500).json({ success: false, error: 'Failed to upload data.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

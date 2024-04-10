require("dotenv").config();
const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const app = express();
const asyncHandler = require("express-async-handler");
const axios = require('axios')
const bodyParser = require('body-parser');
const openai = require("./config/open-ai");
const {
  searchChannels,
  searchVideos,
  getVideosByChannelId,
  getVideoById,
} = require("./utils/youtubeUtil");
const { videointelligence } = require("googleapis/build/src/apis/videointelligence");

const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:8000",
  // "https://desksync-hdbsv2.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());

app.post(
  "/api/gpt-summarize",
  asyncHandler(async (req, res) => {
    const { additionalPrompt, transcript} = req.body
    try {
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You can adapt to user requirements. You can detect the length of the given text, and based on that length, it's up to you if you how long is the summary you're going to write. You can select from these lengths: 50-word, 100-word, 150-word, 200-word. Those are the only choices. Your response format is Title: ... \n\n Content: ...`,
          },
          { role: "assistant", content: `Write a summary of this text. ALWAYS give me a title and a content so that I'll be able to parse it. ${additionalPrompt}` },
          {role: "user", content: transcript }
        ],
        model: "gpt-3.5-turbo-0125",
      });

      res.status(200).json({
        success: true,
        message: response.choices[0].message.content,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  })
);

app.get(
  "/api/search-channels",
  asyncHandler(async (req, res) => {
    try {
      const searchQuery = req.query.search_query;
      const channels = await searchChannels(searchQuery, 5);
      res.status(200).json({
        success: true,
        channels,
      });
    } catch (error) {
      next(error);
    }
  })
);

app.get(
  "/api/search-videos",
  asyncHandler(async (req, res, next) => {
    try {
      const searchQuery = req.query.search_query;
      const nextPageToken = req.query.next_page_token; 
      const videosData = await searchVideos(searchQuery, nextPageToken, 10);
      const videos = videosData.items || []; 

      res.status(200).json({
        success: true,
        nextPageToken: videosData.nextPageToken,
        videos,
      });
    } catch (error) {
      next(error);
    }
  })
);

app.get(
  "/api/search-videos/:channelId",
  asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;

    try {
      const videos = await getVideosByChannelId(channelId, 5);
      res.status(200).json({
        success: true,
        videos,
      });
    } catch (error) {
      next(error);
    }
  })
);

app.get('/api/videos', asyncHandler(async(req, res, next) => {

  try {
    const searchQuery = req.query.search_query;
    const nextPageToken = req.query.next_page_token; 
    const videoData = await getVideoById(searchQuery, nextPageToken, 10);

    res.status(200).json({
      success: true,
      video: videoData.items,
    })
  } catch (error) {
    next(error)
  }
}))

app.get(
  "/api/get-captions/:videoId/:additionalPrompt?",
  asyncHandler(async (req, res, next) => {
    const {videoId, additionalPrompt} = req.params;
    const command = `python transcriptor.py ${videoId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing the script: ${error}`);
        return res.status(400).json({
          success: false,
          error: "English transcription is not available"
        });
      }

      const summarizationData = {
        transcript: stdout, 
        additionalPrompt : additionalPrompt ?? ''
      };
      axios.post("http://localhost:5000/api/gpt-summarize", summarizationData)
        .then(response => {
          console.log("Summarization response:", response.data);
          res.status(200).json({transcription: stdout, ...response.data});
        })
        .catch(error => {
          console.error("Error in summarization request:", error);
          res.status(500).json({
            success: false,
            message: "Error in summarization request"
          });
        });
    });
  })
);


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

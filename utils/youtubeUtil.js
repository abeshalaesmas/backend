const { google } = require("googleapis");

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_DATA_API_KEY
});

async function searchChannels(query, maxResults = 10) {
  try {
    const response = youtube.search.list({
      q: query,
      part: "snippet",
      maxResults,
      type: "channel",
    });
    return response.data.items;
  } catch (error) {
    throw new Error("Error fetching channels from YouTube API");
  }
}

async function getVideosByChannelId(channelId, maxResults = 15) {
  try {
    const response = youtube.search.list({
      channelId,
      part: "snippet",
      maxResults,
      type: "video",
      videoCaption: "closedCaption",
    });
    return response.data.items;
  } catch (error) {
    throw new Error("Error fetching videos from YouTube API");
  }
}

async function searchVideos(query, nextPageToken = null, maxResults = 10) {
  try {
    const response = await youtube.search.list({
      q: query,
      part: "snippet",
      maxResults,
      type: "video",
      pageToken: nextPageToken,
    });
    console.log(response.data)
    return response.data;
  } catch (error) {
    throw new Error("Error fetching videos from YouTube API");
  }
}

async function getVideoById(query) {
  try {
    const response = await youtube.videos.list({
      id: query,
      part: "snippet,contentDetails,statistics",
    })
    console.log(response.data)
    return response.data;
  } catch (error) {
    throw new Error("Error fetching videos from YouTube API");
  }
}

module.exports = {
  searchChannels,
  getVideosByChannelId,
  searchVideos,getVideoById
};

import sys
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

video_ids = ''
formatter = TextFormatter()

for i in range(1, len(sys.argv)):
    video_ids += sys.argv[i] + ' '

transcript = YouTubeTranscriptApi.get_transcript(video_ids)

print(formatter.format_transcript(transcript))

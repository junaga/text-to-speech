import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import { emptyDir, outputFile } from "fs-extra"
const DIR = "dist/"

async function synthesize(text) {
  const client = new TextToSpeechClient()

  // Format the request
  const request = {
    input: { text },
    // https://cloud.google.com/text-to-speech/docs/voices
    voice: { languageCode: "en-US", name: "en-US-Wavenet-F" },
    audioConfig: { audioEncoding: "MP3" } // "LINEAR16" or "OGG_OPUS"
  }

  // Run the request
  const [response] = await client.synthesizeSpeech(request)
  const speech = response.audioContent

  return speech
}

async function main() {
  const text = "This is a synthetic voice, it actually sounds kinda awesome"
  const output = DIR + "speech.mp3"

  const speech = await synthesize(text)
  await emptyDir(DIR)
  await outputFile(output, speech)
}

main()

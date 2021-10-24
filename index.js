#!/usr/bin/env node

import { argv } from "process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"

import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import { SpeechMarkdown } from "speechmarkdown-js"
import { Command } from "commander"

const THIS_DIR = dirname(fileURLToPath(import.meta.url))
const CONFIG_FILE = "./config.json"
const INPUT_EXTENSIONS = ["txt", "smd", "ssml"] // must be UTF-8 encoding
// https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize#audioencoding
const ENCODINGS_BY_EXTENSION = {
  mp3: "MP3",
  wav: "LINEAR16"
}
// https://github.com/speechmarkdown/speechmarkdown-js#options
const SPEECH_MARKDOWN_OPTIONS = {
  includeFormatterComment: true,
  platform: "google-assistant"
}

/**
 * @param {string} input directory
 * @param {string} output directory
 * @param {Object} options parsed from the CLI
 * @returns {Promise<void>}
 */
async function textToSpeech(input, output, options) {
  // Parse `options`
  const audioFormat = options.wav ? "wav" : "mp3"
  const config = await fs.readJSON(join(THIS_DIR, CONFIG_FILE))
  const { voice, audioConfig = {} } = config.voices[options.voice]
  audioConfig.audioEncoding = ENCODINGS_BY_EXTENSION[audioFormat]

  // Prepare filesystem
  const allFiles = await fs.readdir(input)
  const inputFiles = allFiles.filter((file) => {
    const extension = file.split(".").pop()
    const accepted = INPUT_EXTENSIONS.includes(extension)
    return accepted
  })
  await fs.emptyDir(output)

  // init libraries
  const client = new TextToSpeechClient()
  const speechMarkdown = new SpeechMarkdown(SPEECH_MARKDOWN_OPTIONS)

  let requests = []
  for (const fileName of inputFiles) {
    const [name, extension] = fileName.split(".")

    // 1:1 text file to audio file
    const inputPath = join(input, fileName)
    const outputPath = join(output, name + "." + audioFormat)

    // Craft the request object
    const file = await fs.readFile(inputPath, { encoding: "UTF-8" })
    let text, isSsml
    if (extension === "txt") {
      text = file
      isSsml = false
    } else if (extension === "smd") {
      text = speechMarkdown.toSSML(file)
      isSsml = true
    } else if (extension === "ssml") {
      text = file
      isSsml = true
    }
    const request = {
      input: { [isSsml ? "ssml" : "text"]: text },
      voice,
      audioConfig
    }

    const writeAudio = async (response) => {
      const speech = response[0].audioContent
      await fs.outputFile(outputPath, speech)
      console.debug(outputPath)
    }
    const speaking = client.synthesizeSpeech(request).then(writeAudio)
    requests.push(speaking)
  }

  await Promise.all(requests)
}

/**
 * Does NOT return and stops the thread IF:
 *  -V, --version
 *  -h, --help
 * was given.
 */
function runCli({ name: pkgName, version, description }, rawArgs) {
  const binName = pkgName.split("/").pop() // Remove package scope
  const command = new Command()

  // Define the interface
  command.name(binName).version(version).description(description)
  command.argument("<input>", "directory with .txt, .smd or .ssml files")
  command.argument("<output>", "directory for .mp3 files")
  command.option("-v, --voice <voice>", "to use", "germanSales")
  command.option("--wav", "output lossless .wav instead of .mp3")

  command.parse(rawArgs)
  const args = command.args
  const opts = command.opts()

  // console.debug("Parsed CLI args: ", { args, opts })
  return { args, opts }
}

async function main() {
  const pkgJSON = await fs.readJSON(join(THIS_DIR, "package.json"))
  const { args, opts } = runCli(pkgJSON, argv)
  const [input, output] = args
  await textToSpeech(input, output, opts)
}

main()

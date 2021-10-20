import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import { Command } from "commander"
import { argv } from "process"
import fs from "fs-extra"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const DIR = dirname(fileURLToPath(import.meta.url))
const CONFIG_FILE = "./config.json"
const ENCODINGS = {
  mp3: "MP3",
  wav: "LINEAR16"
}

async function textToSpeech(input, output, opts) {
  const format = opts.wav ? "wav" : "mp3"
  const client = new TextToSpeechClient()

  const config = await fs.readJSON(join(DIR, CONFIG_FILE))
  const { voice, audioConfig = {} } = config.voices[opts.voice]
  audioConfig.audioEncoding = ENCODINGS[format]

  const files = await fs.readdir(input)
  const textFiles = files.filter((file) => file.endsWith(".txt"))
  await fs.emptyDir(output)
  const extension = "." + format

  let requests = []
  for (const file of textFiles) {
    const inputPath = join(input, file)
    const outputPath = join(output, file.replace(/.txt$/, extension))

    const text = await fs.readFile(inputPath, { encoding: "UTF-8" })
    const request = { input: { text }, voice, audioConfig }

    const writeSpeech = async (response) => {
      const speech = response[0].audioContent
      await fs.outputFile(outputPath, speech)
    }
    const speaking = client.synthesizeSpeech(request).then(writeSpeech)
    requests.push(speaking)
  }

  await Promise.all(requests)
}

/**
 * Does NOT return and stops the thread IF:
 *  -V, --version
 *  -h, --help
 * is given.
 * @param {Object} pkgJSON
 * @returns {Object}
 */
function runCli({ name, version, description }) {
  const command = new Command()

  // Define the interface
  command.name(name).version(version).description(description)
  command.argument("<input>", "directory with .txt files")
  command.argument("<output>", "directory for .mp3 files")
  command.option("-v, --voice <voice>", "to use", "germanSales")
  command.option("--wav", "output lossless .wav instead of .mp3")

  // Parse the raw `process.argv`
  command.parse(argv)
  const args = command.args
  const opts = command.opts()

  // console.debug("Parsed CLI args: ", { args, opts })
  return { args, opts }
}

async function main() {
  const pkgJSON = await fs.readJSON(join(DIR, "package.json"))
  const { args, opts } = runCli(pkgJSON)
  const [input, output] = args

  await textToSpeech(input, output, opts)
}

main()

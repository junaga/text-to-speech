A CLI to transform written text files (`.txt`, `.smd` and `.ssml`) into naturally sounding, spoken human voice, audio files (`.mp3` or `.wav`). Using the [partially free](https://cloud.google.com/text-to-speech/pricing), Google Cloud Platform, Machine Learning, Text to Speech API.

- [API demo](https://cloud.google.com/text-to-speech#section-2)
- [API docs](https://cloud.google.com/text-to-speech/docs/apis)
- [Speech Markdown (`.smd`) docs](https://www.speechmarkdown.org/basics/what/)

## Get a GCP service account

You need a GCP _service account_ JSON key file as credential to authenticate against the API. A service account is a Google account, but for computers/containers, not humans.

1. Option one

   Ask your local GCP admin. lol

1. Option two

   Follow [this guide](https://cloud.google.com/text-to-speech/docs/before-you-begin#overview), where you're going to:

   1. Create a [GCP Project](https://cloud.google.com/docs/overview), with billing enabled
   2. Turn on the Text to Speech API
   3. Generated a [service account](https://cloud.google.com/docs/authentication/production) that has project access (i.e. viewer)

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the _absolute_, not _relative_ path of the key file. The variable is read by the `@google-cloud/text-to-speech` package, the APIs' official nodejs client used in this tool.

## Usage

```sh
sudo npm install --global @junaga/tts

# # Assuming the following:
# $ ls -1
# service-account.json
# text-smd-or-ssml-files/

# use the `$PWD` variable to save 5 seconds of your life
export GOOGLE_APPLICATION_CREDENTIALS=$PWD/service-account.json

# The default `--voice` is `germanSales`
tts --voice tikTok text-smd-or-ssml-files/ mp3-output/

# Check out `mp3-output/`
```

Run `tts --help` for all options.

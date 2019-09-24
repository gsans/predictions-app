<template>
  <div class="form-body">
    <form v-on:submit.prevent autocomplete="off">
      <div>
        <div class="row">
          <div class="column translation-input">
            <textarea v-model='form.translateField' autocomplete="off"></textarea>
          </div>
          <div class="column translation-output">
            <textarea v-model='form.translation1' readonly autocomplete="off"></textarea>
          </div>
        </div>
        <select v-bind:class="detectedClass" v-model='form.selectedSource' @change="onChange($event.target.value)">
          <option v-for="(sl, index) of sourceLanguages" v-bind:value='sl' :key="index">{{sl.name}}</option>
        </select>
        <select v-model='form.selectedTarget'>
          <option v-for="(tl, index) of targetLanguages" v-bind:value='tl' :key="index">{{tl.name}}</option>
        </select>
        <button type="button" @click="translate()" :disabled="form.translateField.length===0 || disabledInput">Translate</button>
        <button type="button" @click="detectLanguage()" :disabled="form.translateField.length===0 || disabledInput">Detect Language</button>
      </div>
      <div>
        <div class="row">
          <div style="width: 100%;">
            <textarea v-model='form.speechField' class="xl" autocomplete="off"></textarea>
          </div>
        </div>
        <div class="row">
          <select v-model='form.selectedSpeech' @change="onSpeechChange()">
            <option v-for="(l, index) of speechLanguages" v-bind:value='l' :key="index">{{l.name}}</option>
          </select>
          <select v-model='form.selectedVoice'>
            <option v-for="(v, index) of voicesList" v-bind:value='v' :key="index">{{v}}</option>
          </select>
          <select v-model='form.selectedSpeed' @change="onSpeedChange()">
            <option v-for="(v, index) of speedsList" v-bind:value='v.id' :key="index">{{v.name}}</option>
          </select>
          <button type="button" @click="textToSpeech()" :disabled="form.speechField.length===0 || disableSpeech">Listen</button>
          <button type="button" @click="stop()" :disabled="!enableStop">Stop</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
//import Storage from '@aws-amplify/storage';
import Predictions, { InterpretTextCategories } from '@aws-amplify/predictions';
import amplify from '../aws-exports';

let REKOGNITION_LANGUAGES = [ 
  { id: "ar", name: "Arabic" }, 
  { id: "zh", name: "Chinese (Simplified)" },
  { id: "zh-TW", name: "Chinese (Traditional)" },
  { id: "cs", name: "Czech" },
  { id: "da", name: "Danish" },
  { id: "nl", name: "Dutch" },
  { id: "en", name: "English" },
  { id: "fi", name: "Finnish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "he", name: "Hebrew" },
  { id: "hi", name: "Hindi" },
  { id: "id", name: "Indonesian" },
  { id: "it", name: "Italian" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "ms", name: "Malay" },
  { id: "no", name: "Norwegian" },
  { id: "fa", name: "Persian" },
  { id: "pl", name: "Polish" },
  { id: "pt", name: "Portuguese" },
  { id: "ru", name: "Russian" },
  { id: "es", name: "Spanish" },
  { id: "sv", name: "Swedish" },
  { id: "tr", name: "Turkish" },
];
   
let POLLY_LANGUAGES = [ 
  { id: "xx-xx", name: "Select", voices: ["Select"]},
  { id: "arb", name: "Arabic", voices: ["Zeina (female)"] }, 
  { id: "cmn-CN", name: "Chinese, Mandarin", voices: ["Zhiyu (female)"] },
  { id: "da-DK", name: "Danish", voices: ["Naja (female)", "Mads (male)"] },
  { id: "nl-NL", name: "Dutch", voices: ["Lotte (female)", "Ruben (male)"] },
  { id: "en-AU", name: "English, Australian", voices: ["Nicole (female)", "Russell (male)"] },
  { id: "en-GB", name: "English, British", voices: ["Amy (female)", "Emma (female)", "Brian (male)"] },
  { id: "en-IN", name: "English, Indian", voices: ["Aditi (female)", "Raveena (female)"] },
  { id: "en-US", name: "English, US", voices: ["Ivy (female)", "Joanna (female)", "Kendra (female)", "Kimberly (female)", "Salli (female)", "Joey (male)", "Justin (male)", "Matthew (male)"] },
  { id: "en-GB-WLS", name: "English, Welsh", voices: ["Geraint (male)"] },
  { id: "fr-FR", name: "French", voices: ["Celine (female)", "Mathieu (male)"] },
  { id: "fr-CA", name: "French, Canadian", voices: ["Chantal (female)"] },
  { id: "hi-IN", name: "Hindi", voices: ["Aditi (female)"] },
  { id: "de-DE", name: "German", voices: ["Marlene (female)", "Vicki (female)", "Hans (male)"] },
  { id: "is-IS", name: "Icelandic", voices: ["Dora (female)", "Karl (male)"] },
  { id: "it-IT", name: "Italian", voices: ["Carla (female)", "Bianca (female)", "Giorgio (male)"] },
  { id: "ja-JP", name: "Japanese", voices: ["Mizuki (female)", "Takumi (male)"] },
  { id: "ko-KR", name: "Korean", voices: ["Seoyeon (female)"]},
  { id: "nb-NO", name: "Norwegian", voices: ["Liv (female)"] },
  { id: "pl-PL", name: "Polish", voices: ["Ewa (female)", "Maja (female)", "Jacek (male)", "Jan (male)"] },
  { id: "pt-BR", name: "Portuguese, Brazilian", voices: ["Vitoria (female)", "Ricardo (male)"] },
  { id: "pt-PT", name: "Portuguese, European", voices: ["Ines (female)", "Cristiano (male)"] },
  { id: "ro-RO", name: "Romanian", voices: ["Carmen (female)"] },
  { id: "ru-RU", name: "Russian", voices: ["Tatyana (female)", "Maxim (male)"] },
  { id: "es-ES", name: "Spanish, European", voices: ["Conchita (female)", "Lucia (female)", "Enrique (male)"] },
  { id: "es-MX", name: "Spanish, Mexican", voices: ["Mia (female)"] },
  { id: "es-US", name: "Spanish, US", voices: ["Penelope (female)", "Miguel (male)"] },
  { id: "sv-SE", name: "Swedish", voices: ["Astrid (female)"] },
  { id: "tr-TR", name: "Turkish", voices: ["Filiz (female)"] },
  { id: "cy-GB", name: "Welsh", voices: ["Gwyneth (female)"] },
];

let PLAYRATE_VALUES = [
  // { id:  -1, name: "Backwards" },  // not supported
  { id: 0.5, name: "Slow" },
  { id:   1, name: "Normal" },
  { id:   2, name: "Fast" },
];

export default {
  name: 'Text',
  data() {
    return {
      form : { 
        translateField: "Mi sastre es rico!",
        translation1: "",
        speechField: "Mi sastre es rico!",
        selectedSource: REKOGNITION_LANGUAGES.find(x => x.id == amplify.predictions.convert.translateText.defaults.sourceLanguage),
        selectedTarget: REKOGNITION_LANGUAGES.find(x => x.id == amplify.predictions.convert.translateText.defaults.targetLanguage),
        selectedSpeech: POLLY_LANGUAGES.find(x => x.id == amplify.predictions.convert.speechGenerator.defaults.LanguageCode),
        selectedVoice: "",
        selectedSpeed: 1,
      },
      disabledInput: false,
      disabledDetect: false,
      detectedClass: { "detected": false, "not-available": false },
      sourceLanguages: REKOGNITION_LANGUAGES,
      targetLanguages: REKOGNITION_LANGUAGES,
      speechLanguages: POLLY_LANGUAGES,
      voicesList: [],
      disableSpeech: false,
      audio: new Audio(), 
      enableStop: false,
      speedsList: PLAYRATE_VALUES,
    }
  },
  created() {
    this.selectDefaultVoice();
    this.audio.defaultPlaybackRate = this.form.selectedSpeed;
  },
  methods: {
    translate() {
      //debugger;
      let textToTranslate = this.form.translateField;
      this.form.translation1 += "...";
      this.disabledInput = true;
      Predictions.convert({
        translateText: {
          source: {
            text: textToTranslate,
            language: this.form.selectedSource.id // defaults configured on aws-exports.js
            // supported languages https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
          },
          targetLanguage: this.form.selectedTarget.id
        }
      })
      .then(({text}) => {
        this.form.translation1 = text;
      })
      .catch(() => {
        this.form.translation1 = "";
      })
      .finally(() => {
        this.disabledInput = false;
        this.resetDetect(false, false);
      })
    },
    onChange() {
      this.resetDetect(false, false);
    },
    resetDetect(f1, f2) {
      this.detectedClass = { "detected": f1, "not-available": f2 };
    },
    detectLanguage() {
      let textToInterpret = this.form.translateField;
      this.disabledDetect = true;
      Predictions.interpret({
        text: {
          source: {
            text: textToInterpret,
          },
          type: InterpretTextCategories.LANGUAGE
        }
      })
      .then((result) => {
        let detected = result.textInterpretation.language;
        let available = REKOGNITION_LANGUAGES.find(x => x.id == detected);
        if (available) {
          this.form.selectedSource = REKOGNITION_LANGUAGES.find(x => x.id == detected);
          this.resetDetect(true, false);
          //console.log(`Language detected: ${detected}`)
        } else {
          this.resetDetect(false, true);
          //console.log(`Language detected: ${detected}. Language still not available for translations.`)
        }
      })
      .catch(() => {
        this.form.translation1 = "";
      })
      .finally(() => {
        this.disabledDetect = false;
      })
    },
    textToSpeech() {
      let textToTranslate = this.form.speechField;
      let voiceId = this.form.selectedVoice.split(" ")[0];
      Predictions.convert({
        textToSpeech: {
          source: {
            text: textToTranslate,
          },
          voiceId: voiceId // default configured on aws-exports.js 
          // list of different options are here https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
        }
      })
      .then((result) => {
        if (result.speech.url) {
          this.enableStop = true;
          this.audio.src = result.speech.url;
          this.audio.playbackRate = this.form.selectedSpeed;
          this.audio.play();
          this.audio.onended = () => {
            this.enableStop = false;
          };
        }
      })
    },
    stop() {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.enableStop = false;
    },
    selectDefaultVoice() {
      let selectedSpeech = this.form.selectedSpeech;
      if (selectedSpeech) {
        // find partial match of default voice
        let defaultVoice = amplify.predictions.convert.speechGenerator.defaults.VoiceId;
        let voiceIndex = selectedSpeech.voices.findIndex(element => element.includes(defaultVoice))
        // set in select
        this.voicesList = selectedSpeech.voices;
        this.form.selectedVoice = selectedSpeech.voices[voiceIndex];
      }
    },
    onSpeechChange() {
      let selectedSpeech = this.form.speechLanguage;
      if (selectedSpeech) {
        this.voicesList = selectedSpeech.voices;
        //this.createForm.get('voice').patchValue(selectedSpeech.voices[0]);
      }
    },
    onSpeedChange() {
      this.audio.playbackRate = this.form.selectedSpeed || 1;  
    }
  },
}
</script>

<style>
textarea:not([rows]), .translation-output {
  max-height: 600px;
  min-height: 120px;
}
textarea {
  xdisplay: block;
  xmax-width: 100%;
  xmin-width: 100%;
  padding: .625em;
}
textarea {
  box-shadow: inset 0 1px 2px rgba(10,10,10,.1);
  max-width: 100%;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
       box-sizing: border-box;
}
textarea {
  background-color: #fff;
  border-color: #dbdbdb;
  border-radius: 4px;
  color: #363636;

  font-family: 'Roboto',arial,sans-serif;
  font-size: 24px;
  line-height: 32px;
  xpadding-left: 28px;
  resize: none;
}

textarea.xl {
  width: 200%;
}


/* remove blue highlight */
textarea:hover, 
input:hover:not([type="checkbox"]), 
textarea:active, 
input:active:not([type="checkbox"]), 
textarea:focus, 
input:focus:not([type="checkbox"]),
button:focus,
button:active,
button:hover,
label:focus,
.btn:active,
.btn.active,
select
{
  outline:0px !important;
  -webkit-appearance:none;
  box-shadow: none !important;
}

input:not([type="checkbox"]), select {
  width: 100px;
  padding: 6px;
  font-size: 14px;
  color: var(--input-color);
  background-color: var(--input-background-color);
  background-image: none;
  border: 1px solid var(--lightGrey);
  border-radius: 3px;
  box-sizing: border-box;
  margin: 10px;
  height: 35px;
}

.translation-row {
  width: 90%;
  margin: 0px;
}

.translation-input textarea {
    border-radius: 4px 0 0 4px;
    border-right: 10px solid #dbdbdb;
}
.translation-output textarea {
    background-color: #eee;
    border-radius: 0 4px 4px 0;
}

.row {
  display: flex;
}

.column {
  flex: 50%;
}


button:disabled,
button[disabled]{
  background-color: #dbdbdb;
  color: #666666;
}

 

.form-body select.detected {
  border-color: rgba(255, 153, 0, 1);
  border-width: 3px;
}

.form-body select.not-available {
  border-color: #DD3F5B;
  border-width: 3px;
}
</style>

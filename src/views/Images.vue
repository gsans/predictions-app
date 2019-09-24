<template>
  <div class="app-body">
    <form v-on:submit.prevent autocomplete="off">
      <input type="file" name="file" id="file" class="inputfile" ref="fileInput" @change="addFile($event)" />
      <label for="file">Find Keanu!</label>
      <div class="result">
        {{ resultMessage }}
        <div v-if="showResult">
          <img v-if="keanuFound" class="thumbnail-image" src="../assets/success.png" />
          <img v-if="!keanuFound" class="thumbnail-image" src="../assets/fail.png" />
        </div>
        <div v-if="celebrities.length>0">
          <div v-for="(e, index) of celebrities" :key="index">
            <a :href="'http://' + e.metadata.urls[0]" target="_blank">{{e.metadata.name || 'Not found'}}</a>
          </div>
        </div>
      </div>
    </form> 
  </div>
</template>

<script>
//import Storage from '@aws-amplify/storage';
import Predictions from '@aws-amplify/predictions';
//import amplify from '../aws-exports';

export default {
  name: 'images',
  data() {
    return {
      resultMessage: "Pick an image to identify.",
      showResult: false,
      keanuFound: false,
      celebrities: [],
    }
  },
  methods: {
    addFile(event) {
      this.showResult = false;
      this.celebrities = [];
      this.resultMessage = "Looking for Keanu..."
      const { target: { files } } = event;
      if (files.length===0) {
        return;
      }
      const file = files[0];
      Predictions.identify({
        entities: {
          source: {
            file,
          },
          celebrityDetection: true
        }
      }).then(result => {
        if (result.entities.length>0) {
          this.celebrities = [];
          let keanuFound = result.entities.filter( (entity) => {
            //@ts-ignore
            const {metadata: {name} = { } } = entity;
            if (name) {
              this.celebrities.push(entity);
            }
            return name == "Keanu Reeves";
          })
          if (keanuFound.length>0) {
            this.showResult = true;
            this.resultMessage = `Yeah! Keanu found!`;
            this.keanuFound = true;
          } else {
            this.showResult = true;
            this.resultMessage = `Nope! Keanu is not here! Keep trying!`;
            this.keanuFound = false;
          }
        } else {
          this.showResult = true;
          this.resultMessage = `Nope! Keanu is not here! Keep trying!`;
          this.keanuFound = false;
        }
      })
      .catch(err => { 
        //console.log(err);
        this.resultMessage = "There was an error. Try again later. " + err
      })
      .finally(() => {
        this.$refs["fileInput"].value = "";
        //this.fileInput.nativeElement.value = "";
      })
    }
  }
}
</script>

<style>
.app-body {
  width: 60%;
  margin: 0 auto;
  text-align: center;
}
.app-body button {
  background-color: #ff9900;
  font-size: 14px;
  color: white;
  text-transform: uppercase;
  padding: 1em;
  border: none;
  cursor: pointer;
  margin: 10px;
}
.app-body button:hover {
  opacity: 0.8;
}

.file-input-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: -1;
}

.file-input-wrapper > input[type="file"] {
  font-size: 200px;
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
}

.img {
  display: flex;
  justify-content: center;
  align-items: center;
  display: -webkit-flex;
  -webkit-justify-content: center;
  -webkit-align-items: center;
}
.img img {
  width: 20%;
}

input.file {
  width: 100%;
}


.inputfile {
	width: 0.1px;
	height: 0.1px;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
}

.inputfile + label {
  display: inline-block;
  cursor: pointer; /* "hand" cursor */

  background-color: #ff9900;
  font-size: 14px;
  color: white;
  text-transform: uppercase;
  padding: 1em;
  border: none;
  cursor: pointer;
  margin: 10px;
}

.inputfile:focus + label {
	outline: 1px dotted #000;
	outline: -webkit-focus-ring-color auto 5px;
}



/* Customize the label (the container) */
.container {
  xdisplay: block;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Hide the browser's default checkbox */
.container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Create a custom checkbox */
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 25px;
  width: 25px;
  background-color: #eee;
}

/* On mouse-over, add a grey background color */
.container:hover input ~ .checkmark {
  background-color: #ccc;
}

/* When the checkbox is checked, add a blue background */
.container input:checked ~ .checkmark {
  background-color: #ff9900;
}

/* Create the checkmark/indicator (hidden when not checked) */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

/* Show the checkmark when checked */
.container input:checked ~ .checkmark:after {
  display: block;
}

/* Style the checkmark/indicator */
.container .checkmark:after {
  left: 9px;
  top: 5px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

.result {
  margin: 15px;
}

.thumbnail-image{
  width: 400px;
}
</style>
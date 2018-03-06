const Alexa = require('alexa-sdk');
const Speech = require('ssml-builder');
const axios = require('axios');


// Insert your alexa skill ID here
const APP_ID = 'amzn1.ask.skill.<ID>';

const SERVER_ERROR_MESSAGE = 'There was a problem getting information from the server.';
const UNHANDLED_MESSAGE = 'Sorry I did not understand you.';

const AIR_QUALITY_API_URL = '<API URL>';

// For our demo app we get the air quality info of one air station
const REQUEST_DATA = {
....
}


/**
 * Lambda handler for the alexa skill.
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
exports.handler = function(event, context, callback){
  let alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};


// Handlers for each of the skills of the Alexa app.
let handlers = {
  'AirStatus': function() {
    getEnvironmentalData(REQUEST_DATA).then(response => {
      const alexaOutput = generateOutput(response);
      this.emit(':tell', alexaOutput);
    }).catch(error => {
      this.emit(':tell', SERVER_ERROR_MESSAGE);
    });
  },
  'Unhandled': function () {
    this.emit(':tell', UNHANDLED_MESSAGE);
  }
};


/**
 * Get air quality information from the API.
 * @param {*} airData 
 */
function getEnvironmentalData(airData) {
  const requestConfig = {
    method: 'POST',
    url: AIR_QUALITY_API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': '<Bearer token>'
    },
    data: airData,
    json: true
  };

  return axios(requestConfig).then(response => {
    console.log('Got response. ', response);
    return Promise.resolve(response.data);
  }).catch(err => {
    console.log('Error:', err);
    return Promise.reject(error);
  });
}


/**
 * Generate output for the Alexa app depending on the current air quality info.
 * @param {*} airData 
 */
function generateOutput(airData) {
  const speech = new Speech();

  let currentHour = new Date().getHours();
  let measurement = getMeasurementByHour(airData, currentHour);
  let measurementValue = parseInt(measurement.measurment.Bitola2, 10);

  speech.say(`Current air quality, in particular presence of PM 10 particles is ${measurementValue}. `);

  if(measurementValue < 25) {
    speech.say('The air is clear and you can breathe freely.');
  } else if (measurementValue < 50) {
    speech.say('The air is partially clear so my advice is not to stay outside for too long.');
  } else if(measurementValue < 100) {
    speech.say('Air pollution is high so if you plan to go out take your gas mask with you.')
  } else {
    speech.say(`Put your gas mask on. It's a gas chamber outside`);
  }

  return speech.ssml(true);
}


/**
 * Extract the air data for the specified hour.
 * @param {*} airData 
 * @param {*} currentHour 
 */
function getMeasurementByHour(airData, currentHour) {
  for(let i=0; i<airData.length; i++) {
    let hour = parseInt(airData[i].hour.trim(), 10);
    if(hour === currentHour) {
      return airData[i];
    }
  }
}
import { Agent, Tool } from '@neuron.js/core';
import 'dotenv/config'

const weatherTool = new Tool(
  'weather_gov_query',
  'Fetches real-time weather data from an weather.gov.',
  {
    properties: {
      latitude: {
        type: 'string',
        description: 'latitude of the location where weather data is required',
        required: true
      },
      longitude: {
        type: 'string',
        description: 'latitude of the location where weather data is required',
        required: true
      },
      locationName: {
        type: 'string',
        description: 'name of the location where weather data is required',
        required: true
      }
    },
  },
  async (inputs, secrets) => {
    try {
        const response = await fetch(
            `https://api.weather.gov/points/${inputs.latitude},${inputs.longitude}`
        );
        const data = await response.json();
        const forecastResponse = await fetch(data.properties.forecast);
        const forecastData = await forecastResponse.json();
        return `Weather forecast in ${inputs.locationName} is ${forecastData.properties.periods[0].detailedForecast}`;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
  }
)


const WeatherAgent = new Agent(
  'WeatherAgent',
  {
    persona: 'You are a cheerful and approachable virtual assistant dedicated to delivering accurate, concise, and engaging weather updates. Your tone is warm, lively, and always focused on making weather information easy to understand and fun to receive.',
    goal: 'Provide the current weather for a specified location as soon as the city or location details are provided. Your response should be both informative and conversational, ensuring clarity and usefulness for the user.',
    secrets: {
      OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
    }
  }
)

WeatherAgent.registerTool(weatherTool)

const result = await WeatherAgent.execute("I'm travelling to Tahoe, what is the weather there?")
console.log("RESULT:", result);

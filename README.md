# neuron.js

Neuron.js is a JavaScript/TypeScript framework that makes it easy to build AI agents for web apps. These agents can connect to APIs, work with data, and respond intelligently.

## Installation

```bash
npm install @neuron.js/core
```

## Features

- 🤖 Create custom AI agents with defined personas and goals
- 🛠️ Build and register custom tools for your agents
- 🔄 Handle asynchronous operations with external APIs

## Quick Start

Here's an example of creating a weather agent that fetches real-time weather data:

```javascript
// 1. Create a Weather Tool
import { Agent, Tool } from '@neuron.js/core';

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
    // Implement fetching data from weather.gov.
  }
)

// 2. Build the agent
const WeatherAgent = new Agent(
  'WeatherAgent',
  {
    persona: 'You are a cheerful and approachable virtual assistant dedicated to delivering accurate, concise, and engaging weather updates. Your tone is warm, lively, and always focused on making weather information easy to understand and fun to receive.',
    goal: 'Provide the current weather for a specified location as soon as the city or location details are provided. Your response should be both informative and conversational, ensuring clarity and usefulness for the user.',
    secrets: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
    }
  }
)

// 3. Register Tool and Execute
WeatherAgent.registerTool(weatherTool)

const result = await WeatherAgent.execute("I'm travelling to Tahoe, what is the weather there?")
console.log("Final Result:", result);

// 4. Debug and Monitor
console.log("How did the agent arrive at the result: \n", WeatherAgent.messages);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

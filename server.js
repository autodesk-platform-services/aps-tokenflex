const express = require("express");
const session = require("cookie-session");
const { PORT, SERVER_SESSION_SECRET } = require("./config.js");
const { authRefreshMiddleware } = require("./services/aps.js"); // Import middleware
const fetch = require("node-fetch"); // For making fetch requests

const app = express();
let usecases = [];
app.use(express.static("wwwroot"));
app.use(
  session({ secret: SERVER_SESSION_SECRET, maxAge: 24 * 60 * 60 * 1000 })
);
app.use(require("./routes/auth.js"));
app.use(express.json()); // Middleware to parse JSON request bodies

// Helper function to introduce delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to send API requests with exponential backoff
const sendApiRequest = async (url, options, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      } else if (response.status === 429) {
        const backoffTime = 2 ** attempt * 1000; // Exponential backoff
        console.warn(
          `Rate limit hit. Retrying in ${backoffTime / 1000} seconds...`
        );
        await delay(backoffTime);
      } else {
        console.error(`API error: ${response.statusText}`);
        const errorResponse = await response.json();
        throw new Error(
          `API responded with error: ${JSON.stringify(errorResponse)}`
        );
      }
    } catch (error) {
      console.error(
        `Error in API request (attempt ${attempt + 1}):`,
        error.message
      );
    }
  }
  throw new Error("Failed to complete the API request after retries.");
};

// Endpoint to fetch data from Autodesk API (contexts)
app.get("/api/contract", authRefreshMiddleware, async (req, res) => {
  try {
    const token = req.internalOAuthToken.access_token;

    const response = await fetch(
      "https://developer.api.autodesk.com/tokenflex/v1/contract",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching API data:", error);
    res.status(500).send("Failed to fetch data");
  }
});

// Endpoint to submit the selected contextId and make API requests
app.post("/api/submit-dropdown", authRefreshMiddleware, async (req, res) => {
  try {
    const { selectedValue } = req.body;
    if (!selectedValue) {
      return res.status(400).json({ message: "No selected value provided" });
    }

    console.log("Received selected dropdown value:", selectedValue);
    const token = req.internalOAuthToken.access_token;

    // Custom request bodies for six use cases
    const usecaseBodies = [
      // Define the same use cases as before
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
      {
        fields: ["usageCategory", "productName"],
        metrics: ["tokensConsumed"],
        where: "contractYear=1",
      },
    ];

    const queryIds = [];

    // Fetch query IDs for all use cases
    for (let i = 0; i < usecaseBodies.length; i++) {
      console.log(`Requesting usecase ${i + 1}`);
      const url = `https://developer.api.autodesk.com/tokenflex/v1/usage/${selectedValue}/query`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usecaseBodies[i]),
      };

      try {
        const queryData = await sendApiRequest(url, options);
        queryIds.push(queryData.id);
      } catch (error) {
        console.error(`Skipping usecase ${i + 1} due to error:`, error.message);
        break;
      }
    }

    // Fetch data for each query ID
    const usecases = [];
    for (let i = 0; i < queryIds.length; i++) {
      const queryId = queryIds[i];
      console.log(`Fetching data for queryId ${queryId}`);
      const url = `https://developer.api.autodesk.com/tokenflex/v1/usage/${selectedValue}/query/${queryId}?offset=0&limit=25`;
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        // Fetch query status to check if it's completed
        const queryStatusData = await sendApiRequest(url, options);

        // If the query status is COMPLETED, push the data to the usecases array
        if (queryStatusData.status === "DONE") {
          usecases.push(queryStatusData);
          console.log(`Data fetched for queryId ${queryId}`);
        } else {
          console.log(
            `Query ID ${queryId} is in status '${queryStatusData.status}'. Retrying...`
          );

          i--; // Retry the same query ID again in the next loop iteration
        }
      } catch (error) {
        console.error(
          `Error fetching data for queryId ${queryId}:`,
          error.message
        );
      }
    }

    // Respond with collected data
    if (usecases.length > 0) {
      console.log("Collected usecase data:", usecases);
      res.json(usecases);
    } else {
      res.status(404).json({ message: "No data available for the usecases" });
    }
  } catch (error) {
    console.error("Error processing dropdown value:", error.message);
    res.status(500).json({ message: "Failed to process dropdown value" });
  }
});

app.get("/api/usecase1", (req, res) => {
  res.json(usecases);
});

// Chatbot endpoint for advanced queries
app.post("/api/chatbot", authRefreshMiddleware, (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Generate contextual response based on current data
    const response = generateChatbotResponse(message, context, usecases);
    
    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to process chatbot request" });
  }
});

function generateChatbotResponse(message, context, currentUsecases) {
  const lowerMessage = message.toLowerCase();
  
  // Contextual responses based on actual data
  if (lowerMessage.includes('current usage') || lowerMessage.includes('how much')) {
    if (currentUsecases && currentUsecases.length > 0) {
      // Extract usage statistics from current data
      let totalUsage = 0;
      const categories = new Set();
      
      currentUsecases.forEach(usecase => {
        if (usecase.result && Array.isArray(usecase.result)) {
          usecase.result.forEach(item => {
            if (item.value && typeof item.value === 'number') {
              totalUsage += item.value;
            }
            if (item.usageCategory) {
              categories.add(item.usageCategory);
            }
          });
        }
      });
      
      return `Based on your current contract data, you have ${categories.size} usage categories with a total of ${totalUsage.toLocaleString()} tokens consumed. The main categories are: ${Array.from(categories).slice(0, 3).join(', ')}.`;
    } else {
      return "Please select a contract from the dropdown menu first to see your current usage data.";
    }
  }
  
  if (lowerMessage.includes('highest') || lowerMessage.includes('most used')) {
    if (currentUsecases && currentUsecases.length > 0) {
      let maxUsage = 0;
      let topCategory = '';
      
      currentUsecases.forEach(usecase => {
        if (usecase.result && Array.isArray(usecase.result)) {
          usecase.result.forEach(item => {
            if (item.value && item.value > maxUsage) {
              maxUsage = item.value;
              topCategory = item.usageCategory || item.productName || 'Unknown';
            }
          });
        }
      });
      
      return `Your highest usage category is "${topCategory}" with ${maxUsage.toLocaleString()} tokens consumed.`;
    }
  }
  
  if (lowerMessage.includes('optimization') || lowerMessage.includes('reduce costs')) {
    return "To optimize your Token Flex costs:\n• Monitor usage patterns in the charts\n• Identify peak usage times to better plan capacity\n• Focus on optimizing high-consumption categories\n• Consider batch processing for better efficiency\n• Review unused or underutilized services";
  }
  
  if (lowerMessage.includes('trends') || lowerMessage.includes('pattern')) {
    return "The time-based charts show your usage trends. Look for:\n• Peak usage periods during specific times\n• Seasonal variations in consumption\n• Growth trends in different categories\n• Opportunities for workload distribution";
  }
  
  // Default responses for common queries
  const responses = {
    'export': 'Currently, you can view the charts and take screenshots. Data export functionality could be added in future updates.',
    'real-time': 'The data refreshes when you select different contracts. For real-time monitoring, consider setting up automated reporting.',
    'alerts': 'Usage alerts and notifications could be configured based on threshold limits for proactive monitoring.',
    'history': 'Select different contracts to view historical usage patterns and compare consumption across time periods.'
  };
  
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  return "I can help you analyze your Token Flex usage data. Try asking about current usage, trends, optimization tips, or specific chart information.";
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

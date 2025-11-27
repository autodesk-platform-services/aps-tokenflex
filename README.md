# APS Token Flex Web App

A web application for visualizing Autodesk Platform Services (APS) Token Flex usage data with interactive charts and an AI-powered chatbot assistant.

## Features

- OAuth 2.0 authentication with Autodesk
- Six interactive charts displaying Token Flex usage metrics
- Modern UI with Chart.js visualizations

## Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- An Autodesk Platform Services account
- APS Client ID and Client Secret from [APS Portal](https://aps.autodesk.com/myapps)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/autodesk-platform-services/aps-tokenflex.git
cd aps-tokenflex-webapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to your `.env` file:

```env
APS_CLIENT_ID=your_client_id_here
APS_CLIENT_SECRET=your_client_secret_here
APS_CALLBACK_URL=http://localhost:8080/api/auth/callback
SERVER_SESSION_SECRET=your_random_secret_phrase_here
```

**Important Configuration Details:**

- **APS_CLIENT_ID**: Get this from your [APS application](https://aps.autodesk.com/myapps)
- **APS_CLIENT_SECRET**: Found in the same location as your Client ID
- **APS_CALLBACK_URL**: Must match the callback URL configured in your APS app settings (default: `http://localhost:8080/api/auth/callback`)
- **SERVER_SESSION_SECRET**: Create a random string for encrypting session cookies (e.g., `my-super-secret-phrase-12345`)

### 4. Configure APS Application

1. Go to [APS Developer Portal](https://aps.autodesk.com/myapps)
2. Create a new application or select an existing one
3. Add the callback URL: `http://localhost:8080/api/auth/callback`
4. Enable the following API scopes:
   - `data:read`
   - `data:write`
   - Add any other scopes your application requires

### 5. Run the Application

```bash
npm start
```

The application will start on [http://localhost:8080](http://localhost:8080)

## Project Structure

```
aps-tokenflex-webapp/
├── wwwroot/              # Frontend files
│   ├── index.html        # Main HTML page
│   ├── main.js           # Main application logic
│   ├── main.css          # Styles
│   ├── login.js          # Chart configurations
│   └── chatbot.js        # Chatbot functionality
├── routes/               # Express routes
│   └── auth.js           # Authentication routes
├── services/             # Backend services
│   └── aps.js            # APS SDK integration
├── config.js             # Configuration loader
├── server.js             # Express server setup
├── .env                  # Environment variables (create this)
├── .gitignore            # Git ignore rules
└── package.json          # Dependencies
```

## Usage

### Authentication

1. Click the "Login" button in the top-right corner
2. Sign in with your Autodesk account
3. Authorize the application

### Viewing Token Flex Data

1. After login, select a contract number from the dropdown menu
2. Six charts will display different usage metrics:
   - Usage by category
   - Product-wise distribution
   - Time-series trends
   - And more...


## API Endpoints

- `GET /api/auth/login` - Initiate OAuth login
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `GET /api/contract` - Get available contracts
- `POST /api/submit-dropdown` - Submit selected contract
- `POST /api/chatbot` - Chatbot message handler


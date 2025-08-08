# Cartesia Voice Integration Setup

## Overview
This application supports Cartesia as a voice provider alongside Eleven Labs. To use Cartesia voices, you need to configure your Cartesia API token.

## Prerequisites
- A valid Cartesia account
- Cartesia API token/credentials

## Setup Instructions

### 1. Get Your Cartesia API Token
1. Log in to your Cartesia account
2. Navigate to your account settings or API section
3. Generate or copy your API token
4. Keep this token secure - it will be stored locally in your browser

### 2. Configure the Token in the Application
1. Go to the Campaign Form > Voice step
2. Select "Cartesia" from the Provider dropdown
3. If no token is configured, you'll see a configuration panel
4. Enter your Cartesia API token in the input field
5. Click "Configure" to save the token
6. The application will automatically fetch available Cartesia voices

### 3. Using Cartesia Voices
- Once configured, you can browse and select Cartesia voices
- Cartesia voices will appear in the voice list with their details
- You can play voice samples to preview them
- Select a voice by checking the "Use voice" checkbox

## Troubleshooting

### Token Not Working
- Verify your Cartesia API token is correct
- Check if your Cartesia account has the necessary permissions
- Ensure your token hasn't expired

### No Voices Appearing
- Check the browser console for error messages
- Verify the Cartesia API endpoint is accessible
- Contact your administrator if the backend Cartesia integration needs configuration

### API Errors
- Check the error message displayed in the UI
- Verify your network connection
- Contact support if the issue persists

## Security Notes
- The Cartesia token is stored in your browser's localStorage
- This token is only accessible to this application
- Clear your browser data to remove the token
- Use the "Remove Token" button in the UI to clear the token

## Backend Configuration
The backend needs to be configured to support Cartesia API calls. The frontend expects the following endpoint:
- `GET /api/v1/cartesia/voices` - Returns available Cartesia voices

Contact your system administrator if the backend Cartesia integration is not working.

## Support
If you encounter issues with Cartesia integration:
1. Check this documentation
2. Verify your Cartesia account and token
3. Contact your system administrator
4. Check the application logs for detailed error messages 
@echo off
echo Setting up environment for Glyphs Bot Game...
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo # Discord Bot Configuration > .env
    echo DISCORD_TOKEN=your_bot_token_here >> .env
    echo CLIENT_ID=your_client_id_here >> .env
    echo GUILD_ID=your_guild_id_here >> .env
    echo. >> .env
    echo # Optional: Welcome channel ID >> .env
    echo WELCOME_CHANNEL_ID=your_welcome_channel_id_here >> .env
    echo.
    echo .env file created! Please edit it with your actual values.
) else (
    echo .env file already exists.
)

echo.
echo To get your Guild ID:
echo 1. Enable Developer Mode in Discord (User Settings ^> Advanced ^> Developer Mode)
echo 2. Right-click on your server name
echo 3. Select "Copy Server ID"
echo 4. Paste it as GUILD_ID in the .env file
echo.
echo To get your Bot Token and Client ID:
echo 1. Go to https://discord.com/developers/applications
echo 2. Select your bot application
echo 3. Copy the Token from the "Bot" section
echo 4. Copy the Application ID from the "General Information" section
echo.
pause


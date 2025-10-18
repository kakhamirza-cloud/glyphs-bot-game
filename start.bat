@echo off
echo Starting Glyphs Mining Bot...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Build the project
echo Building project...
npm run build
echo.

REM Start the bot
echo Starting bot...
npm start

echo.
echo Bot started! Use Ctrl+C to stop the bot
pause

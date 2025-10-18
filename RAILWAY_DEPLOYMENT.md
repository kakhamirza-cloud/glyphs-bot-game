# Railway Deployment Guide for Glyphs Bot Game

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- Discord Bot Token and Application ID
- GitHub repository with your code

### 2. Railway Setup

1. **Connect GitHub Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Glyphs Bot Game repository

2. **Configure Environment Variables**
   In the Railway dashboard, go to your project → Variables tab and add:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_application_id_here
   GUILD_ID=your_discord_server_id_here
   WELCOME_CHANNEL_ID=your_welcome_channel_id_here (optional)
   PORT=3000
   ```

3. **Deploy**
   - Railway will automatically detect the `railway.json` configuration
   - The build process will run: `npm run build && npm start`
   - Your bot will be deployed and running!

### 3. Verification

1. **Check Deployment Status**
   - Go to your Railway project dashboard
   - Check the "Deployments" tab for build status
   - Look for "Deployed" status

2. **Test Health Endpoint**
   - Railway provides a public URL for your service
   - Visit: `https://your-app-name.railway.app/`
   - You should see: `{"message":"Glyphs Bot Game is running","status":"online","bot":"connected"}`

3. **Test Discord Bot**
   - Go to your Discord server
   - Use `/start` command to begin the mining game
   - Verify the bot responds correctly

## 🔧 Configuration Details

### Railway Configuration (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables Required

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ | `your_bot_token_here` |
| `CLIENT_ID` | Your Discord application ID | ✅ | `123456789012345678` |
| `GUILD_ID` | Your Discord server ID | ✅ | `987654321098765432` |
| `WELCOME_CHANNEL_ID` | Channel for welcome messages | ❌ | `111222333444555666` |
| `PORT` | Port for health check server | ❌ | `3000` (default) |

### Discord Bot Permissions Required
- Send Messages
- Use Slash Commands
- Create Public Threads
- Create Private Threads
- Manage Threads
- Read Message History
- Embed Links

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation works locally
   - Check Railway build logs for specific errors

2. **Bot Doesn't Respond**
   - Verify `DISCORD_TOKEN` is correct
   - Check that bot has proper permissions in Discord
   - Ensure `CLIENT_ID` matches your Discord application

3. **Health Endpoint Not Working**
   - Check Railway deployment logs
   - Verify `PORT` environment variable is set
   - Ensure Express server is running correctly

4. **Commands Not Registered**
   - Check that `GUILD_ID` is correct
   - Verify bot is in the correct Discord server
   - Check Railway logs for command registration errors

### Logs and Monitoring

1. **View Logs**
   - Go to Railway dashboard → Your project → Deployments
   - Click on the latest deployment
   - View "Logs" tab for real-time output

2. **Monitor Health**
   - Railway automatically monitors your service
   - Health checks run on the `/` endpoint
   - Failed health checks trigger automatic restarts

## 🔄 Updates and Maintenance

### Updating Your Bot
1. Push changes to your GitHub repository
2. Railway automatically detects changes and redeploys
3. Monitor the deployment in Railway dashboard

### Environment Variable Updates
1. Go to Railway dashboard → Variables
2. Update the required variables
3. Railway automatically restarts the service

### Scaling
- Railway automatically scales based on traffic
- No additional configuration needed
- Monitor usage in Railway dashboard

## 📊 Performance Monitoring

Railway provides built-in monitoring:
- CPU and memory usage
- Request metrics
- Error rates
- Response times

Access these metrics in your Railway project dashboard.

## 🆘 Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify environment variables are set correctly
3. Test the bot locally first
4. Check Discord bot permissions
5. Review the troubleshooting section above

---

**Happy Mining! ⛏️**

Your Glyphs Bot Game should now be successfully deployed on Railway!

# Emparo Food System - Render Deployment Guide

## Prerequisites
1. A Render account (free tier available)
2. Your application code in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Database Setup
1. In your Render dashboard, create a new PostgreSQL database
2. Choose the free tier if you're testing
3. Note down the database connection string

### 2. Web Service Setup
1. Create a new Web Service in Render
2. Connect your Git repository
3. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

### 3. Environment Variables
Set these environment variables in your Render web service:
- `NODE_ENV`: `production`
- `DATABASE_URL`: (your PostgreSQL connection string from step 1)

### 4. Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Your app will be available at the generated URL

## Database Migration
After deployment, you'll need to run the database migrations:
1. Go to your web service shell in Render dashboard
2. Run: `npm run db:push`

## Features
- Real-time order management system
- Kitchen display for order tracking
- Complete menu management for Emparo Food
- WebSocket communication between order and kitchen screens
- Responsive design for tablets and desktops

## Support
The application includes:
- PIN-based authentication (default: 1234 or "admin")
- Complete Emparo Food menu with categorized items
- Order status tracking (new → preparing → ready → served)
- Notification sounds for new orders
- Clean meal upgrade interface for main items
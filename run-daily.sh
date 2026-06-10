#!/bin/bash
# Automatically generated runner for ObioRadar daily cron job
cd /Users/apple/Documents/00.PERSONAL/ObioRadar
export PATH="/Users/apple/.nvm/versions/node/v22.22.0/bin:$PATH"
mkdir -p logs
npm run daily >> logs/daily.log 2>&1

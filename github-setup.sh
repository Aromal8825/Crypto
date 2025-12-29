#!/bin/bash

# GitHub Repository Setup Script for Crypto Dashboard
# 
# Instructions:
# 1. First create a new repository on GitHub (https://github.com/new)
# 2. Replace YOUR_USERNAME and REPO_NAME below with your actual values
# 3. Run this script: ./github-setup.sh

# Configuration - REPLACE THESE VALUES
GITHUB_USERNAME="YOUR_USERNAME"
REPO_NAME="crypto-dashboard"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up GitHub repository...${NC}"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: Please run this script from the Crypto project directory${NC}"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Git repository not initialized${NC}"
    exit 1
fi

# Validate configuration
if [ "$GITHUB_USERNAME" = "YOUR_USERNAME" ] || [ "$REPO_NAME" = "REPO_NAME" ]; then
    echo -e "${RED}Error: Please update GITHUB_USERNAME and REPO_NAME in this script${NC}"
    exit 1
fi

# Add remote origin
echo -e "${BLUE}Adding GitHub remote...${NC}"
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}✅ Successfully uploaded to GitHub!${NC}"
echo -e "${GREEN}Your repository is available at: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}${NC}"

# Optional: Open in browser (uncomment if desired)
# xdg-open "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
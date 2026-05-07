# Use a stable Node.js base image
FROM node:20-slim

# Install system dependencies for FileConvertor (Industry Version)
# - libreoffice: For document conversions (pdf, docx, etc.)
# - pandoc: For extended document conversions
# - p7zip-full: For archive management
# - imagemagick & ghostscript: For image and PDF processing
# - ffmpeg: For audio and video processing
RUN apt-get update && apt-get install -y \
    libreoffice \
    pandoc \
    calibre \
    p7zip-full \
    imagemagick \
    ghostscript \
    ffmpeg \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY Server/package*.json ./Server/

# Install root dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (this also triggers npm install in the Server directory)
RUN npm run build

# Expose the port used by the Express server
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["npm", "start"]

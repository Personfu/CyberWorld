# Use official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies strictly
RUN npm ci

# Copy the rest of the backend source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the standard Colyseus WebSocket port
EXPOSE 2567

# Command to run the authoritative server
CMD ["npm", "start"]

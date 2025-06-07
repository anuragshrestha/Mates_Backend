FROM node:18

# Create app dir
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
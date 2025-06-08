FROM node:18

# Create app dir
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install 
RUN npm install -g nodemon

# Copy source code
COPY . .



# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "run", "dev"]
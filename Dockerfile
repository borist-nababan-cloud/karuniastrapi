FROM node:18-alpine

# 1. Install system dependencies required for Strapi/Sharp
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev

# 2. Set the working directory to the standard Strapi path
WORKDIR /opt/app

# 3. Install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# 4. Copy the entire project source
COPY . .

# 5. Build the Strapi admin panel and backend
# This generates the 'dist' folder containing the compiled JS config
ENV NODE_ENV=production
RUN npm run build

# 6. Expose the port and start the app
EXPOSE 1337
CMD ["npm", "run", "start"]
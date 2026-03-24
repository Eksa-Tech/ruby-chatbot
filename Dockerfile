# Menggunakan Node.js sebagai base image
FROM node:20-bookworm-slim

# Install Ruby, build tools, dan dependencies untuk Chromium (Puppeteer)
RUN apt-get update && apt-get install -y \
    ruby \
    ruby-dev \
    build-essential \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && gem install bundler \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables untuk Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files dan install Node dependencies
COPY bridge/package*.json ./bridge/
RUN cd bridge && npm install

# Copy Gemfile dan install Ruby dependencies
COPY brain/Gemfile* ./brain/
RUN cd brain && \
    bundle config set --local path 'vendor/bundle' && \
    bundle install --jobs 4 --retry 3

# Copy semua file project
COPY . .

# Pastikan script start.sh bisa dieksekusi
RUN chmod +x start.sh

# Port default Railway
EXPOSE 3001

# Jalankan script utama
CMD ["./start.sh"]

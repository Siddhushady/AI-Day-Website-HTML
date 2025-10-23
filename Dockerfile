# Use official Nginx image as base
FROM nginx:latest

# Copy all project files (HTML, JS, CSS, images) to the Nginx web directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

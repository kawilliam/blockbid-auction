# Multi-stage build for efficient Docker image
FROM maven:3.8-openjdk-17 AS builder

# Set working directory
WORKDIR /app

# Copy pom.xml first (for better layer caching)
COPY pom.xml .

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-jammy

# Set working directory
WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create data directory for H2 database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
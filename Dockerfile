FROM rust:1.76-slim as builder

WORKDIR /usr/src/app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app

# Install required packages (like CA certificates for network requests if needed later)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from the builder
COPY --from=builder /usr/src/app/target/release/waelio-sync /usr/local/bin/waelio-sync
COPY static ./static

# Expose the default port
EXPOSE 3070

# Define the environment variable for where the JSON data should be stored.
# When deploying, you should map a persistent volume to /data
ENV DB_FILE_PATH=/data/sync_data.json
ENV PORT=3070
ENV HOST=0.0.0.0

# Create the data directory
RUN mkdir -p /data

CMD ["waelio-sync"]

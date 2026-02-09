FROM rust:1.85-bookworm AS builder
WORKDIR /src

# Build dependencies first for better caching
COPY backend/Cargo.toml backend/Cargo.lock ./backend/
RUN mkdir -p backend/src && echo "fn main() {}" > backend/src/main.rs
RUN cargo build --manifest-path backend/Cargo.toml --release && rm -rf backend/src

# Build actual application
COPY backend ./backend
COPY static ./static
RUN cargo build --manifest-path backend/Cargo.toml --release

FROM debian:bookworm-slim

ARG UID=1001
ARG GID=1001

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    groupadd --gid "${GID}" pollyuser; \
    useradd --uid "${UID}" --gid "${GID}" --create-home --home-dir /app pollyuser; \
    mkdir -p /app/static /app/data; \
    chown -R pollyuser:pollyuser /app; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /src/backend/target/release/polly-backend /usr/local/bin/polly-backend
COPY --chown=pollyuser:pollyuser static ./static

ENV STORAGE_BACKEND=sqlite \
    SQLITE_PATH=/app/data/polly.db \
    BIND_ADDR=0.0.0.0 \
    PORT=3000

USER pollyuser
EXPOSE 3000

CMD ["/usr/local/bin/polly-backend"]

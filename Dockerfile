FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o simpletodo ./app

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/simpletodo /usr/local/bin/simpletodo

# Config
ENV SIMPLETODO_HOME=/data
VOLUME ["/data"]

EXPOSE 8000

CMD ["simpletodo"]

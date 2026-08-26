FROM golang:1.26-alpine AS builder
WORKDIR /source
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -buildvcs=false \
    -ldflags="-s -w -X simpletodo/internal/buildinfo.Version=${VERSION} -X simpletodo/internal/buildinfo.Commit=${COMMIT} -X simpletodo/internal/buildinfo.BuildTime=${BUILD_TIME}" \
    -o /out/simpletodo ./cmd/app

FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /out/simpletodo /usr/local/bin/simpletodo

# Config
ENV SIMPLETODO_HOME=/data
VOLUME ["/data"]

EXPOSE 8000

CMD ["simpletodo"]

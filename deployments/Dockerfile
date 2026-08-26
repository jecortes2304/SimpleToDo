FROM node:24-alpine AS web-builder
WORKDIR /source
# Use exactly the pnpm version declared by the frontend.  Relying on
# Corepack's current default makes image builds non-reproducible.
RUN corepack enable && corepack install --global pnpm@11.21.0
COPY web/package.json web/pnpm-lock.yaml ./web/
RUN pnpm --dir web install --frozen-lockfile
COPY web ./web
RUN pnpm --dir web build

FROM golang:1.26-alpine AS go-builder
WORKDIR /source
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=web-builder /source/internal/app/webdist ./internal/app/webdist
RUN CGO_ENABLED=0 go build -trimpath -buildvcs=false \
    -ldflags="-s -w -X simpletodo/internal/buildinfo.Version=${VERSION} -X simpletodo/internal/buildinfo.Commit=${COMMIT} -X simpletodo/internal/buildinfo.BuildTime=${BUILD_TIME}" \
    -o /out/simpletodo ./cmd/app

FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=go-builder /out/simpletodo /usr/local/bin/simpletodo

# Config
ENV SIMPLETODO_HOME=/data
VOLUME ["/data"]

EXPOSE 8000

CMD ["simpletodo"]

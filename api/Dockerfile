FROM golang:1.25-alpine AS build
WORKDIR /src
COPY . .
# No separate "go mod download" step: it would also fetch the test-only modules.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /api ./cmd/api

FROM alpine:3.22
RUN adduser -D -u 10001 app
COPY --from=build /api /usr/local/bin/api
USER app
EXPOSE 8080
ENTRYPOINT ["api"]

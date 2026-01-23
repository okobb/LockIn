# Build Stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

FROM scratch

WORKDIR /app

# Copy the static binary
COPY --from=builder /app/main .

COPY --from=builder /app/dataset.csv .

EXPOSE 8080

CMD ["./main"]

# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git for fetch dependencies
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

# Run Stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

COPY dataset.csv .

EXPOSE 8080

CMD ["./main"]

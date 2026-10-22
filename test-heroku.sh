#!/bin/bash
# test-heroku.sh
#
# Cach dung:
#   ./test-heroku.sh                      -> tu dong lay URL bang Heroku CLI
#   ./test-heroku.sh https://xxx.herokuapp.com   -> dung URL tu nhap

APP_NAME="n22dccn070-api-gateway"

if [ -n "$1" ]; then
  GATEWAY_URL="${1%/}"
else
  GATEWAY_URL=$(heroku apps:info --app "$APP_NAME" --json 2>/dev/null | jq -r '.app.web_url' | sed 's:/*$::')
fi

if [ -z "$GATEWAY_URL" ] || [ "$GATEWAY_URL" = "null" ]; then
  echo "Khong lay duoc URL. Hay chay: ./test-heroku.sh https://<url-gateway-cua-ban>"
  exit 1
fi

echo "Gateway URL: $GATEWAY_URL"

echo -e "\n\nTesting API Gateway..."
curl -s "$GATEWAY_URL/" | jq .

echo -e "\n\nTesting health checks..."
curl -s "$GATEWAY_URL/health" | jq .

echo -e "\n\nTesting Users service..."
curl -s "$GATEWAY_URL/users" | jq .

echo -e "\n\nCreating new user..."
curl -s -X POST "$GATEWAY_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@heroku.com"}' | jq .

echo -e "\n\nTesting Products service..."
curl -s "$GATEWAY_URL/products" | jq .

echo -e "\n\nCreating new product..."
curl -s -X POST "$GATEWAY_URL/products" \
  -H "Content-Type: application/json" \
  -d '{"name": "Heroku Product", "price": 50, "stock": 100}' | jq .

echo -e "\n\nCreating order..."
curl -s -X POST "$GATEWAY_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "productId": 1, "quantity": 2}' | jq .

echo -e "\n\nGetting all orders..."
curl -s "$GATEWAY_URL/orders" | jq .
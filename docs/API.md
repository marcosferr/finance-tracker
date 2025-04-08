# API Documentation

## Authentication Endpoints

### POST /api/auth/[...nextauth]
Handles all NextAuth.js authentication flows.

### GET /api/auth/providers
Returns available authentication providers.

## Settings Endpoints

### GET /api/settings
Returns user settings.

**Response:**
```json
{
  "theme": "light|dark",
  "currency": "USD",
  "language": "en",
  "openaiApiKey": null|string
}
```

### PATCH /api/settings
Updates user settings.

**Request Body:**
```json
{
  "theme": "light|dark",
  "currency": "USD",
  "language": "en",
  "openaiApiKey": "optional-api-key"
}
```

## Financial Data Endpoints

### POST /api/financial-data/parse
Parses financial documents (PDF/images).

**Request:**
- Multipart form data with file

**Response:**
```json
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "category": "string",
      "amount": number
    }
  ]
}
```

### POST /api/financial-data/report
Generates custom financial reports.

**Request Body:**
```json
{
  "queryDescription": "string"
}
```
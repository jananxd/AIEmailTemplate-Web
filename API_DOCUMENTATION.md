# Backend API Documentation

**Project:** AI Email Template Generator
**Version:** 1.0
**Base URL:** `https://api.yourdomain.com/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Email Endpoints](#email-endpoints)
3. [Project Endpoints](#project-endpoints)
4. [File Upload Endpoints](#file-upload-endpoints)
5. [User Endpoints](#user-endpoints)
6. [Error Handling](#error-handling)
7. [TypeScript Definitions](#typescript-definitions)

---

## Authentication

All endpoints require authentication using Bearer token:

```http
Authorization: Bearer {jwt-token}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## Email Endpoints

### 1. Generate Email (LLM)

Generate email JSON structure using LLM based on user prompt.

```http
POST /emails/generate
```

**Request Body:**
```json
{
  "prompt": "Create a welcome email for new users",
  "projectId": "uuid-optional",
  "attachedImage": "base64-string-optional",
  "userId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "email": {
    "id": "email-uuid",
    "meta": {
      "subject": "Welcome to our platform!",
      "previewText": "Get started with your account"
    },
    "jsonStructure": {
      "meta": {
        "subject": "Welcome to our platform!",
        "previewText": "Get started with your account"
      },
      "root": {
        "id": "root-uuid",
        "type": "section",
        "children": [
          {
            "id": "block-uuid-1",
            "type": "heading",
            "level": 1,
            "text": "Welcome {{firstName}}!"
          },
          {
            "id": "block-uuid-2",
            "type": "text",
            "text": "We're excited to have you on board."
          }
        ]
      },
      "version": 2
    },
    "variables": ["firstName"],
    "prompt": "Create a welcome email for new users",
    "attachedImage": "url-if-uploaded",
    "projectId": "uuid-or-null",
    "createdAt": "2025-10-28T10:30:00Z",
    "updatedAt": "2025-10-28T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid prompt or data
- `401 Unauthorized` - Invalid/missing auth token
- `500 Internal Server Error` - LLM service error

---

### 2. List Emails

Get paginated list of emails, optionally filtered by project.

```http
GET /emails?projectId={uuid}&limit=20&offset=0
```

**Query Parameters:**
- `projectId` (optional) - Filter by project
- `limit` (optional, default: 20) - Pagination limit
- `offset` (optional, default: 0) - Pagination offset

**Response:** `200 OK`
```json
{
  "emails": [
    {
      "id": "email-uuid",
      "meta": {
        "subject": "Welcome email",
        "previewText": "..."
      },
      "jsonStructure": {},
      "prompt": "...",
      "projectId": "uuid-or-null",
      "createdAt": "2025-10-28T10:30:00Z",
      "updatedAt": "2025-10-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3. Get Email by ID

Retrieve a single email by its ID.

```http
GET /emails/:id
```

**Response:** `200 OK`
```json
{
  "email": {
    "id": "email-uuid",
    "meta": {},
    "jsonStructure": {},
    "prompt": "...",
    "attachedImage": "url-or-null",
    "projectId": "uuid-or-null",
    "createdAt": "2025-10-28T10:30:00Z",
    "updatedAt": "2025-10-28T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Email doesn't exist

---

### 4. Update Email

Update email JSON structure (after user edits blocks).

```http
PUT /emails/:id
```

**Request Body:**
```json
{
  "meta": {
    "subject": "Updated subject",
    "previewText": "Updated preview"
  },
  "jsonStructure": {
    "meta": {},
    "root": {},
    "version": 2
  },
  "variables": ["firstName", "amount", "friendName"],
  "projectId": "uuid-or-null"
}
```

**Response:** `200 OK`
```json
{
  "email": {
    "id": "email-uuid",
    "meta": {},
    "jsonStructure": {},
    "updatedAt": "2025-10-28T11:00:00Z"
  }
}
```

---

### 5. Delete Email

Delete an email permanently.

```http
DELETE /emails/:id
```

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Email doesn't exist

---

### 6. Regenerate Email

Regenerate email with modified prompt.

```http
POST /emails/:id/regenerate
```

**Request Body:**
```json
{
  "prompt": "Updated prompt with more details",
  "attachedImage": "base64-optional"
}
```

**Response:** `200 OK`
```json
{
  "email": {
    "id": "email-uuid",
    "jsonStructure": {},
    "prompt": "Updated prompt",
    "updatedAt": "2025-10-28T11:15:00Z"
  }
}
```

---

### 7. Render Email Template (Public API)

**This endpoint is for END USERS to render email templates with their own data.**

Users of your service can call this endpoint from their own applications to render email templates they've created, filling in variables with their own data.

```http
POST /api/public/emails/:id/render
```

**Authentication:** Requires API key (not user JWT)
```http
X-API-Key: {user-api-key}
```

**Request Body:**
```json
{
  "variables": {
    "firstName": "John",
    "amount": "$50",
    "friendName": "Sarah"
  }
}
```

**Response:** `200 OK`
```json
{
  "html": "<html><body>Hey John! You owe $50 to Sarah...</body></html>",
  "plainText": "Hey John! You owe $50 to Sarah..."
}
```

**Use Case:** End users call this from their own backend services to generate personalized emails for their customers.

**Example:**
```javascript
// User's application code
const response = await fetch('https://api.yourdomain.com/api/public/emails/email-uuid/render', {
  method: 'POST',
  headers: {
    'X-API-Key': 'their-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    variables: {
      firstName: customer.firstName,
      amount: invoice.total,
      friendName: invoice.payer
    }
  })
});

const { html } = await response.json();
// Use html to send email via their own email service
```

---

### 8. Send Test Email

Send test email to specified address.

```http
POST /emails/:id/send-test
```

**Request Body:**
```json
{
  "to": "test@example.com",
  "variables": {
    "firstName": "Test User",
    "amount": "$50"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Test email sent to test@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email address

---

## Project Endpoints

### 9. Create Project

Create a new project with brand context.

```http
POST /projects
```

**Request Body:**
```json
{
  "name": "Brand A Marketing",
  "brandContext": {
    "name": "Brand A",
    "description": "Eco-friendly outdoor gear company",
    "logo": "base64-or-url",
    "voiceGuidelines": "Friendly, adventurous, environmentally conscious.",
    "colors": {
      "primary": "#2ECC71",
      "secondary": "#27AE60",
      "accent": "#F39C12"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "project": {
    "id": "project-uuid",
    "name": "Brand A Marketing",
    "brandContext": {},
    "emailCount": 0,
    "createdAt": "2025-10-28T10:00:00Z",
    "updatedAt": "2025-10-28T10:00:00Z"
  }
}
```

---

### 10. List Projects

Get paginated list of projects.

```http
GET /projects?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:** `200 OK`
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "name": "Brand A Marketing",
      "brandContext": {},
      "emailCount": 12,
      "createdAt": "2025-10-28T10:00:00Z",
      "updatedAt": "2025-10-28T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 11. Get Project by ID

Retrieve a single project with its emails.

```http
GET /projects/:id
```

**Response:** `200 OK`
```json
{
  "project": {
    "id": "project-uuid",
    "name": "Brand A Marketing",
    "brandContext": {},
    "emails": [
      {
        "id": "email-uuid",
        "meta": {
          "subject": "..."
        },
        "createdAt": "..."
      }
    ],
    "emailCount": 12,
    "createdAt": "2025-10-28T10:00:00Z",
    "updatedAt": "2025-10-28T10:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Project doesn't exist

---

### 12. Update Project

Update project details and brand context.

```http
PUT /projects/:id
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "brandContext": {
    "name": "Brand A",
    "description": "Updated description",
    "logo": "url",
    "voiceGuidelines": "Updated guidelines",
    "colors": {
      "primary": "#2ECC71",
      "secondary": "#27AE60",
      "accent": "#F39C12"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "project": {
    "id": "project-uuid",
    "name": "Updated Project Name",
    "brandContext": {},
    "updatedAt": "2025-10-28T11:30:00Z"
  }
}
```

---

### 13. Delete Project

Delete a project.

```http
DELETE /projects/:id?deleteEmails=false
```

**Query Parameters:**
- `deleteEmails` (optional, default: false) - If true, delete all emails in project. If false, unassign emails.

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Project doesn't exist

---

## File Upload Endpoints

### 14. Upload Image

Upload image for email blocks or brand logos.

```http
POST /uploads/image
```

**Request:** `multipart/form-data`
```
Content-Type: multipart/form-data

file: [binary image data]
```

**Response:** `201 Created`
```json
{
  "url": "https://cdn.yourdomain.com/images/uuid.png",
  "width": 800,
  "height": 600,
  "size": 245678,
  "mimeType": "image/png"
}
```

**Validation:**
- Max file size: 5MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp

**Error Responses:**
- `400 Bad Request` - Invalid file type or too large
- `413 Payload Too Large` - File exceeds size limit

---

## User Endpoints

### 15. Get Current User

Get authenticated user information.

```http
GET /users/me
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Optional Helper Endpoints

### Extract Variables from JSON

Parse email JSON and return all detected variables.

```http
POST /emails/extract-variables
```

**Request Body:**
```json
{
  "jsonStructure": {
    "root": {
      "type": "section",
      "children": [
        {
          "type": "heading",
          "text": "Hey {{firstName}}!"
        },
        {
          "type": "text",
          "text": "You owe {{amount}} to {{friendName}}"
        }
      ]
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "variables": ["firstName", "amount", "friendName"]
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context if applicable"
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- **Email Generation:** 20 requests/minute per user
- **Other endpoints:** 100 requests/minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1698765432
```

**Response when rate limited:** `429 Too Many Requests`
```json
{
  "error": "RateLimitExceeded",
  "message": "Too many requests. Please try again later.",
  "details": {
    "retryAfter": 60
  }
}
```

---

## TypeScript Definitions

### Email Types

```typescript
interface Email {
  id: string
  meta: EmailMeta
  jsonStructure: EmailJSON
  variables: string[]  // Detected variables like ["firstName", "amount"]
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

interface EmailMeta {
  subject: string
  previewText: string
}

interface EmailJSON {
  meta: EmailMeta
  root: EmailNode
  version: number
}

interface EmailNode {
  id: string
  type: 'section' | 'heading' | 'text' | 'button' | 'image' | 'divider' | 'spacer'
  children?: EmailNode[]

  // Heading properties
  level?: 1 | 2 | 3

  // Text/Heading properties
  text?: string

  // Button properties
  label?: string
  href?: string
  target?: '_blank' | '_self'

  // Image properties
  src?: string
  alt?: string
  width?: number
  height?: number

  // Spacer properties
  height?: number

  // Section properties (container)
  backgroundColor?: string
  padding?: string
  borderRadius?: string
}
```

### Project Types

```typescript
interface Project {
  id: string
  name: string
  brandContext: BrandContext
  emails?: Email[]
  emailCount: number
  createdAt: string
  updatedAt: string
}

interface BrandContext {
  name: string
  description: string
  logo?: string
  voiceGuidelines: string
  colors: {
    primary: string
    secondary: string
    accent?: string
  }
}
```

### API Response Types

```typescript
interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

interface ApiError {
  error: string
  message: string
  details?: Record<string, any>
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
```

### Upload Types

```typescript
interface UploadedFile {
  url: string
  width: number
  height: number
  size: number
  mimeType: string
}
```

---

## Summary

### Required Endpoints (14 total)

**Emails (8):**
1. POST `/emails/generate` - Generate email with LLM
2. GET `/emails` - List all emails
3. GET `/emails/:id` - Get single email
4. PUT `/emails/:id` - Update email
5. DELETE `/emails/:id` - Delete email
6. POST `/emails/:id/regenerate` - Regenerate email
7. POST `/emails/:id/export` - Export as HTML
8. POST `/emails/:id/send-test` - Send test email

**Projects (5):**
9. POST `/projects` - Create project
10. GET `/projects` - List projects
11. GET `/projects/:id` - Get single project
12. PUT `/projects/:id` - Update project
13. DELETE `/projects/:id` - Delete project

**Uploads (1):**
14. POST `/uploads/image` - Upload image

### Public API for End Users (1)

15. POST `/api/public/emails/:id/render` - Render template with variables (called by end users from their apps)

### Optional Endpoints (2)

16. GET `/users/me` - Current user info
17. POST `/users/api-keys` - Generate API key for public endpoints
18. GET `/users/api-keys` - List user's API keys
19. DELETE `/users/api-keys/:keyId` - Revoke API key

---

## Notes for Backend Team

1. **LLM Integration**: The `/emails/generate` endpoint should use the `brandContext` from the project (if `projectId` is provided) to inform the LLM's generation prompt.

2. **Variable Handling - Frontend Responsibility**:
   - Variables use double curly braces: `{{variableName}}`
   - **Frontend extracts variables** from the JSON structure when user edits blocks
   - Frontend sends the `variables` array in the update request
   - Backend just stores the `variables` array - no need to parse the JSON
   - This allows users to call the public render API with their own variable values

3. **Public API for End Users**:
   - Users should be able to generate API keys in the UI
   - The `/api/public/emails/:id/render` endpoint authenticates via API key
   - End users call this from their own services to render templates with custom data
   - This is how users integrate email templates into their own applications

4. **Image Handling**: Images can be provided as base64 strings or URLs. The backend should handle both and return CDN URLs.

5. **Email Rendering**: The `/api/public/emails/:id/render` endpoint should:
   - Take the stored `jsonStructure`
   - Replace `{{variables}}` with provided values
   - Render using React Email or similar to generate final HTML
   - Return both HTML and plain text versions

6. **Database Schema**:
   - Store `jsonStructure` as JSONB (PostgreSQL) or similar
   - Store `variables` as a string array
   - Index on `variables` if you want to allow filtering by variable names

7. **Security**:
   - Validate all user inputs, especially in the JSON structure
   - Rate limit the public API heavily (it's user-facing)
   - API keys should be scoped to specific users/projects

8. **Performance**:
   - Consider caching rendered HTML for common variable combinations
   - The public render endpoint should be very fast (< 100ms)

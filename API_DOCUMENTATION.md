# Backend API Documentation

**Project:** AI Email Template Generator
**Version:** 2.0 (JSX-First Architecture)
**Base URL:** `https://api.yourdomain.com/v1`

**Architecture Note:** This API uses a JSX-first approach. Email templates are stored as JSX source code, and the backend automatically extracts a `props_schema` that defines template variables. No JSON structure storage is used.

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

Generate email template using LLM based on user prompt. Returns JSX source code with extracted props schema.

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
    "subject": "Welcome to our platform!",
    "preview": "Get started with your account",
    "jsx_source": "import { Html, Head, Body, Container, Heading, Text } from '@react-email/components'\n\nexport default function Email({ firstName }) {\n  return (\n    <Html>\n      <Head />\n      <Body>\n        <Container>\n          <Heading>Welcome {firstName}!</Heading>\n          <Text>We're excited to have you on board.</Text>\n        </Container>\n      </Body>\n    </Html>\n  )\n}",
    "props_schema": {
      "firstName": {
        "type": "string",
        "required": true
      }
    },
    "prompt": "Create a welcome email for new users",
    "attached_image": "url-if-uploaded",
    "project_id": "uuid-or-null",
    "created_at": "2025-10-28T10:30:00Z",
    "updated_at": "2025-10-28T10:30:00Z"
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
      "subject": "Welcome email",
      "preview": "...",
      "jsx_source": "...",
      "props_schema": {},
      "prompt": "...",
      "project_id": "uuid-or-null",
      "created_at": "2025-10-28T10:30:00Z",
      "updated_at": "2025-10-28T10:30:00Z"
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
    "subject": "Email subject",
    "preview": "Preview text",
    "jsx_source": "...",
    "props_schema": {},
    "prompt": "...",
    "attached_image": "url-or-null",
    "project_id": "uuid-or-null",
    "created_at": "2025-10-28T10:30:00Z",
    "updated_at": "2025-10-28T10:30:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Email doesn't exist

---

### 4. Update Email

Update email template (JSX source, subject, preview). Backend automatically extracts props_schema from JSX.

```http
PATCH /emails/:id
```

**Request Body:**
```json
{
  "subject": "Updated subject",
  "preview": "Updated preview",
  "jsx_source": "import { Html, Body, Container, Text } from '@react-email/components'\n\nexport default function Email({ firstName, amount }) {\n  return (\n    <Html>\n      <Body>\n        <Container>\n          <Text>Hello {firstName}! Your balance is {amount}.</Text>\n        </Container>\n      </Body>\n    </Html>\n  )\n}",
  "project_id": "uuid-or-null"
}
```

**Response:** `200 OK`
```json
{
  "email": {
    "id": "email-uuid",
    "subject": "Updated subject",
    "preview": "Updated preview",
    "jsx_source": "...",
    "props_schema": {
      "firstName": { "type": "string", "required": true },
      "amount": { "type": "string", "required": true }
    },
    "updated_at": "2025-10-28T11:00:00Z"
  }
}
```

**Note:** The backend automatically parses the JSX source and extracts the props_schema. You don't need to send props_schema manually.

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

Regenerate email JSX with modified prompt.

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
    "jsx_source": "...",
    "props_schema": {},
    "prompt": "Updated prompt",
    "updated_at": "2025-10-28T11:15:00Z"
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
  "props": {
    "firstName": "John",
    "amount": "$50",
    "companyName": "Acme Corp"
  }
}
```

**Response:** `200 OK`
```json
{
  "html": "<html><body>Hey John! Welcome to Acme Corp. Your balance is $50...</body></html>",
  "plainText": "Hey John! Welcome to Acme Corp. Your balance is $50..."
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
    props: {
      firstName: customer.firstName,
      amount: invoice.total,
      companyName: customer.company
    }
  })
});

const { html } = await response.json();
// Use html to send email via their own email service
```

**Note:** The props must match the props_schema extracted from the template's JSX source.

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
  "props": {
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

### Extract Props from JSX

Parse JSX source and return the extracted props schema.

```http
POST /emails/extract-props
```

**Request Body:**
```json
{
  "jsx_source": "import { Html, Body, Text } from '@react-email/components'\n\nexport default function Email({ firstName, amount, friendName }) {\n  return (\n    <Html>\n      <Body>\n        <Text>Hey {firstName}! You owe {amount} to {friendName}</Text>\n      </Body>\n    </Html>\n  )\n}"
}
```

**Response:** `200 OK`
```json
{
  "props_schema": {
    "firstName": { "type": "string", "required": true },
    "amount": { "type": "string", "required": true },
    "friendName": { "type": "string", "required": true }
  }
}
```

**Note:** This is done automatically when creating or updating emails. This endpoint is for validation/preview purposes.

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
  subject: string
  preview: string
  jsx_source: string  // JSX source code as string
  props_schema: PropSchema  // Extracted props schema
  prompt: string
  attached_image?: string
  project_id?: string
  created_at: string
  updated_at: string
}

interface PropSchema {
  [propName: string]: {
    type: string  // 'string', 'number', 'boolean', etc.
    required: boolean
  }
}
```

**Frontend Types (camelCase):**

```typescript
// Frontend uses camelCase for consistency with JavaScript conventions
interface Email {
  id: string
  meta: {
    subject: string
    previewText: string
  }
  jsxSource: string
  propsSchema: PropSchema
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
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

2. **JSX Props Schema Extraction**:
   - Backend automatically parses JSX source code to extract `props_schema`
   - Props schema defines which variables are available in the template
   - Frontend does NOT send `props_schema` - backend extracts it automatically
   - Props use JSX syntax: `{variableName}` (not `{{variableName}}`)

3. **Public API for End Users**:
   - Users should be able to generate API keys in the UI
   - The `/api/public/emails/:id/render` endpoint authenticates via API key
   - End users call this from their own services to render templates with custom data
   - This is how users integrate email templates into their own applications

4. **Image Handling**: Images can be provided as base64 strings or URLs. The backend should handle both and return CDN URLs.

5. **Email Rendering**: The `/api/public/emails/:id/render` endpoint should:
   - Take the stored `jsx_source`
   - Execute JSX with provided props values
   - Render using React Email (`@react-email/render`) to generate final HTML
   - Return both HTML and plain text versions

6. **Database Schema**:
   - Store `jsx_source` as TEXT (JSX source code)
   - Store `props_schema` as JSONB (extracted from JSX)
   - No need to store `json_state` or JSON structure

7. **Security**:
   - Validate all user inputs, especially JSX source code
   - Sanitize JSX to prevent XSS attacks
   - Rate limit the public API heavily (it's user-facing)
   - API keys should be scoped to specific users/projects

8. **Performance**:
   - Consider caching rendered HTML for common prop combinations
   - The public render endpoint should be very fast (< 100ms)
   - Props schema extraction can be cached until JSX changes

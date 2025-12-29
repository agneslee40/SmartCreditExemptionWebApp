# Smart Credit Exemption System

## Key Features

- SL-only authentication
- AI-assisted document analysis
  - PDF text extraction
  - Course similarity evaluation
  - Grade and credit-hour extraction
- Explainable similarity evidence
  - Displays matched text excerpts for transparency
- Manual override support
  - SLs may override AI recommendations with reasons
- Workflow status tracking
  - SL status (Approved / Rejected)
  - PL status automatically updated after SL review
- Dashboard and task management
  - Pending actions
  - Waiting-on-PL overview

---

## Technology Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT-based authentication

### AI & Document Processing
- Gemini-based AI analysis (structured JSON output)
- Text similarity scoring with explainable evidence

---

## Setup Instructions

### Prerequisites
- Node.js
- PostgreSQL
- npm

### Backend Setup
```bash
cd backend
npm install
npm run dev



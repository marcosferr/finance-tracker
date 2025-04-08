# Finance Tracker

A modern personal finance tracking application built with Next.js, TypeScript, and Prisma.

## Features

- 📊 Dashboard with financial insights
- 💰 Transaction tracking and categorization
- 🤖 AI-powered transaction analysis and custom reports
- 📄 PDF statement parsing
- 💬 Financial chat assistant
- 🌓 Light/dark theme support
- 🔐 Authentication with NextAuth
- 🌍 Internationalization support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: 
  - Radix UI
  - Tailwind CSS
  - shadcn/ui
- **AI Integration**: OpenAI GPT-4
- **Analytics**: PostHog
- **PDF Processing**: pdf.js

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key (for AI features)

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="your-posthog-host"
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   └── providers.tsx    # App providers
├── components/          # React components
├── lib/                 # Utility functions
├── prisma/             # Database schema and migrations
└── public/             # Static assets
```

## Key Features Documentation

### Authentication

- Uses NextAuth.js for authentication
- Supports Google OAuth
- Custom login/register pages
- JWT session strategy

### Financial Data Processing

- PDF statement parsing using pdf.js
- AI-powered transaction categorization
- Custom report generation using OpenAI
- Transaction data validation with Zod

### Internationalization

- Multi-language support using next-intl
- Language selection persisted in localStorage
- Default English locale with extensible translations

### Theme System

- Light/dark mode support
- System theme detection
- Theme persistence
- Custom color schemes via Tailwind CSS

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/settings` - User settings management
- `/api/providers` - Auth provider information
- Custom financial data endpoints

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for code formatting

### Component Guidelines

- Use shadcn/ui components when possible
- Implement responsive design
- Follow atomic design principles
- Use CSS modules or Tailwind for styling

### State Management

- Use React hooks for local state
- Implement SWR for data fetching
- Use context for global state when necessary

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Testing

Run tests using:
```bash
npm run test:rate-limit  # For rate limit tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary and confidential.
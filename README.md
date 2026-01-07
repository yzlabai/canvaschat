# CanvasChat

Chat on the canvas, generate ideas with AI.

![Next.js](https://img.shields.io/badge/Next.js-15-black) 
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5-green) 
![Vercel](https://img.shields.io/badge/Vercel-AI%20SDK-orange)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
[![Supabase](https://img.shields.io/badge/supabase-000?logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/drizzle%20orm-000?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Cloudflare Workers](https://img.shields.io/badge/deployed%20on-cloudflare%20workers-000?logo=cloudflare&logoColor=white)](https://github.com/yzlabai/canvaschat)

- **Canvas-based Chat**: Visualize and organize your conversations on an interactive canvas
- **AI-Powered Idea Generation**: Brainstorm, expand, and connect ideas with multiple AI models
- **Built with Modern Stack**: Next.js, Tailwind CSS, Drizzle ORM, and Vercel AI SDK
- **Multi-Model Support**: OpenAI, Anthropic, Google Gemini, and more

## 🌟 Features

- **Canvas Interface**: Interactive canvas for organizing chats and ideas visually
- **AI Idea Generation**: Generate, expand, and connect ideas using AI
- **Multi-Model AI Support**: OpenAI, Anthropic, Google, Replicate, OpenRouter, and more
- **Deep Research**: Web search, file uploads, and memory management
- **User Authentication**: Google OAuth, magic links, and secure session management
- **Modern UI**: Responsive design with dark/light themes using Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Deployment Ready**: Cloudflare Workers, Vercel, and Docker support

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router and React 19, shadcn/ui
- **Styling**: Tailwind CSS 4 with Radix UI components
- **State Management**: Zustand with React Context
- **Type Safety**: TypeScript with strict configuration
- **Animations**: Motion (Framer Motion successor)
- **AI UI**: using prompt-kit and AI-element

### Backend
- **API Routes**: Next.js API routes with middleware
- **Database**: PostgreSQL with Drizzle ORM and Supabase
- **Authentication**: NextAuth.js 5 (Auth.js)
- **AI SDK**: Vercel AI SDK 5.0
- **Task Queue**: Trigger.dev for background jobs

### AI Integration
- **AI SDK**: Vercel AI SDK 5.0 with streaming support
- **Models**: OpenAI GPT, Claude, Gemini, and more
- **Gateway**: AI Gateway for model routing and load balancing
- **Streaming**: Real-time response streaming

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and bun
- PostgreSQL database (local or hosted)
- Environment variables (see configuration below)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yzlabai/canvaschat.git
cd canvaschat
```

2. Install dependencies

```bash
bun install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/canvaschat"

# Authentication
AUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32
AUTH_GOOGLE_ID="your-google-oauth-id"
AUTH_GOOGLE_SECRET="your-google-oauth-secret"

# AI Providers (configure at least one)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Optional: Storage, Email
AWS_ACCESS_KEY_ID="your-aws-key"
RESEND_API_KEY="your-resend-key"
```

4. Set up the database

```bash
# Generate database schema
bun db:generate

# Run migrations
bun db:migrate

# Optional: Open database studio
bun db:studio
```

5. Run the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## ⚙️ Configuration

### Environment Variables

Create your environment file:

- Development: `.env.local` or `.env.development`
- Production: `.env.production`

### Customization

#### Theme and Styling
- Set your theme in `src/app/theme.css`
- Use [tweakcn](https://tweakcn.com/editor/theme) for theme customization

## 🚀 Deployment

### Cloudflare Workers (Recommended)

For new projects, use the Cloudflare branch:

```bash
git clone -b cloudflare https://github.com/yzlabai/canvaschat.git
```

1. Set up environment variables

```bash
cp .env.example .env.production
cp wrangler.toml.example wrangler.toml
```

2. Configure variables in `wrangler.toml`:

```toml
[vars]
DATABASE_URL = "your-database-url"
AUTH_SECRET = "your-auth-secret"
OPENAI_API_KEY = "your-openai-key"
# Add all your environment variables here
```

3. Deploy to Cloudflare

```bash
bun cf:deploy
```

### Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Docker

CanvasChat includes comprehensive Docker support for both development and production environments.

#### Quick Start with Docker

```bash
# Copy environment template
cp .env.docker .env

# Edit .env with your configuration
# Then run development environment
./scripts/docker-deploy.sh dev

# Or production environment
./scripts/docker-deploy.sh prod
```

#### Available Docker Commands

```bash
# Using convenience scripts
./scripts/docker-deploy.sh dev       # Start development environment
./scripts/docker-deploy.sh prod      # Start production environment
./scripts/docker-deploy.sh stop      # Stop all containers
./scripts/docker-deploy.sh logs      # View logs
./scripts/docker-deploy.sh migrate   # Run database migrations
./scripts/docker-deploy.sh cleanup   # Clean up resources

# Using npm scripts
bun docker:build                    # Build production image
bun docker:build-dev               # Build development image  
bun docker:up                      # Start production stack
bun docker:up-dev                  # Start development stack
bun docker:down                    # Stop all containers
bun docker:logs                    # View logs
bun docker:clean                   # Clean up everything
```

#### Docker Compose Files

- `docker-compose.yml` - Basic production setup
- `docker-compose.dev.yml` - Development with hot reloading
- `docker-compose.prod.yml` - Production with health checks and Nginx

#### What's Included

- **Next.js App**: Multi-stage optimized build
- **PostgreSQL**: Database with persistent storage
- **Redis**: Optional caching layer
- **Nginx**: Reverse proxy for production (optional)
- **Health Checks**: Container health monitoring
- **Hot Reloading**: Development environment support

For detailed Docker documentation, see [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md).


## 🛠️ Development

### Database Operations

```bash
# Generate schema from code
bun db:generate

# Apply migrations
bun db:migrate

# Push schema directly (force)
bun db:push

# Open database studio
bun db:studio
```

### Available Scripts

```bash
bun dev          # Development server with Turbopack
bun build        # Production build
bun start        # Start production server
bun lint         # ESLint checks
bun analyze      # Bundle analysis

# Cloudflare specific
bun cf:preview   # Preview deployment
bun cf:deploy    # Deploy to production
bun cf:typegen   # Generate Cloudflare types
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


Built with ❤️ by the CanvasChat team

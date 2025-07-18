# StreetPaws - Stray Animal Management System

A comprehensive digital platform for managing stray animal welfare through QR-coded identification tags. Built with React, TypeScript, Express.js, and PostgreSQL.

## Features

- **Animal Registration**: Complete profile creation with photo upload
- **QR Code Management**: Generate and print QR tags for animal identification  
- **Medical Tracking**: Vaccination records and health status monitoring
- **Search & Discovery**: Advanced filtering and search capabilities
- **Emergency Contacts**: Helpline directory for animal welfare services
- **Progressive Web App**: Installable mobile app with offline functionality

## Technology Stack

- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query
- **Routing**: Wouter
- **File Uploads**: Multer for image handling

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd streetpaws
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
```

4. Push database schema:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment Options

This project includes optimized configuration for multiple deployment platforms:

### Option 1: Railway (Recommended)
1. Visit [railway.app](https://railway.app) and login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Service name: `streetpaws-app`
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
6. Deploy automatically starts

### Option 2: Render (Free Tier)
1. Visit [render.com](https://render.com) and connect GitHub
2. Create "Web Service" from repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node start.js`
   - **Environment**: Node
   - **Plan**: Free
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`

### Option 3: Vercel
1. Visit [vercel.com](https://vercel.com) and import repository  
2. Configure build settings:
   - **Framework**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables
4. Deploy

## Database Setup (Free)

### Using Neon PostgreSQL
1. Go to [neon.tech](https://neon.tech) and signup with GitHub
2. Create new project: `streetpaws`
3. Choose region: Europe (closest to Asia) or US East
4. Environment: Production
5. Copy connection string
6. Add as `DATABASE_URL` environment variable

The database will auto-initialize with tables and Bengaluru helpline data on first deployment.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV` - Set to "production" for deployment (required)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type checking

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/      # Route components
│   │   └── lib/        # Utilities and configurations
├── server/          # Express backend
│   ├── routes.ts    # API endpoints
│   ├── storage.ts   # Database operations
│   └── index.ts     # Server entry point
├── shared/          # Shared types and schemas
└── uploads/         # File upload directory (excluded from git)
```

## Contributing

This is an open-source project focused on animal welfare. Contributions are welcome!

## License

MIT License - see LICENSE file for details

## Support

For deployment issues on Render, check their [documentation](https://render.com/docs) or contact their support team.
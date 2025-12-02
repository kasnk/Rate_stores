# Review Web - Store Rating Platform

A full-stack web application for managing store ratings and reviews. Built with Express.js backend and React + Vite frontend.

## Project Overview

Review Web is a three-role system application that allows:
- **Admins**: Manage users, stores, and view platform statistics
- **Store Owners**: Monitor ratings and feedback for their stores
- **Normal Users**: Browse stores and submit ratings

## Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: Node.js
- **CORS**: Enabled for frontend communication

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **HTTP Client**: Axios (or Fetch API)
- **Styling**: CSS

## Project Structure

```
Review_web/
├── backend/
│   ├── server.js           # Main Express server
│   ├── db.js               # Database configuration
│   ├── package.json        # Backend dependencies
│   ├── controller/         # Route controllers
│   └── Adminlogin/         # Admin login logic
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # Entry point
│   │   ├── App.css         # Styling
│   │   └── assets/         # Static assets
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── index.html          # HTML template
├── builder.config.json     # Build configuration
└── README.md               # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:4000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default)

### Run Both Simultaneously

In separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/change-password` - Change password (authenticated)

### Admin Routes (requires admin role)
- `GET /api/admin/summary` - Dashboard summary (user, store, rating counts)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users with filters
- `POST /api/admin/stores` - Create store
- `GET /api/admin/stores` - List stores with ratings

### User Routes (authenticated)
- `GET /api/stores` - List all stores with ratings
- `POST /api/stores/:storeId/rating` - Submit/update store rating

### Store Owner Routes (requires owner role)
- `GET /api/owner/summary` - Store summary with ratings
- `GET /api/owner/store-raters/:storeId` - View users who rated the store

### Health Check
- `GET /api/health` - API health status

## Default Admin Credentials

```
Email: admin@example.com
Password: Admin@123
```

## Features

- JWT-based authentication
- Role-based access control (Admin, Owner, Normal User)
- Store management and ratings system
- User filtering and search
- Password hashing with bcrypt
- CORS support for frontend communication
- SQLite database with automatic schema initialization

## Development

### Backend Commands
```bash
npm start      # Start server
npm test       # Run tests (if configured)
```

### Frontend Commands
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## License

MIT

## Support

For issues or questions, please refer to the project documentation or contact the development team.

# CineBook Frontend

This is the ReactJS frontend for the CineBook movie booking system - a comprehensive cinema management and booking platform.

## Features

### User Features
- 🔐 **User Authentication** - Login, register, profile management
- 🎬 **Movie Browsing** - Browse movies with advanced search and filtering
- 🏢 **Theater Information** - Detailed theater listings with facilities
- 🕐 **Showtime Management** - Real-time showtime listings and availability
- 💺 **Seat Selection** - Interactive seat selection with real-time booking
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 📊 **User Dashboard** - Booking history and profile management
- 🔔 **Real-time Updates** - Live seat availability and booking status

### Admin Features
- 🎛️ **Admin Dashboard** - Comprehensive statistics and analytics
- 🎬 **Movie Management** - Full CRUD operations with image upload
- 🏢 **Theater Management** - Complete theater administration with facilities
- 🕐 **Showtime Management** - Advanced scheduling with conflict detection
- 👥 **User Management** - Full user administration with role management
- 📊 **Booking Management** - Booking oversight and management
- 📈 **Analytics & Reports** - Revenue, booking, and user analytics
- 🔧 **System Configuration** - Advanced filtering, sorting, and pagination

### Advanced Features
- 🔍 **Advanced Search** - Multi-criteria search with debounced input
- 🎯 **Smart Filtering** - Filter by genre, city, date, status, etc.
- 📄 **Pagination** - Efficient data loading with pagination
- 🔄 **Real-time Sync** - Live updates across all components
- 🛡️ **Security** - Role-based access control and data validation
- 💾 **Data Management** - Optimized API calls and state management

## Tech Stack

- **Frontend Framework**: ReactJS 18
- **Routing**: React Router v6
- **UI Framework**: Bootstrap 5 with React Bootstrap
- **HTTP Client**: Axios for API communication
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Icons**: Bootstrap Icons
- **Styling**: Custom CSS with Bootstrap themes

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx       # Navigation header with auth
│   ├── Footer.jsx       # Site footer
│   └── ...              # Other shared components
├── services/            # API service layer
│   └── api.js           # Centralized API configuration
├── views/               # Main page components
│   ├── admin/           # Admin management pages
│   │   ├── Dashboard.jsx        # Admin dashboard with analytics
│   │   ├── Movies.jsx           # Movie management (CRUD)
│   │   ├── Theaters.jsx         # Theater management (CRUD)
│   │   ├── Users.jsx            # User management (CRUD)
│   │   ├── CreateMovie.jsx      # Movie creation form
│   │   ├── CreateTheater.jsx    # Theater creation form
│   │   └── Routes.jsx           # Admin routing configuration
│   ├── auth/            # Authentication pages
│   │   ├── Login.jsx            # User login
│   │   ├── Register.jsx         # User registration
│   │   └── Profile.jsx          # User profile management
│   ├── booking/         # Booking flow pages
│   │   ├── Seats.jsx            # Seat selection interface
│   │   └── Confirmation.jsx     # Booking confirmation
│   ├── Home.jsx         # Landing page with featured content
│   ├── Movies.jsx       # Public movie listings
│   ├── Theaters.jsx     # Public theater listings
│   ├── MovieDetails.jsx # Detailed movie information
│   └── ...              # Other public pages
├── App.js               # Main app component with routing
├── index.js             # React entry point
└── index.css            # Global styles and theme
```

## Design System

### Color Palette
- **Primary Black**: #141414 (Main background)
- **Primary Gold**: #FFD700 (Accent and highlights)
- **Primary White**: #FFFFFF (Text and contrasts)
- **Secondary Dark**: #2F2F2F (Cards and components)
- **Text Gray**: #CCCCCC (Secondary text)
- **Success Green**: #28a745 (Success states)
- **Danger Red**: #dc3545 (Error states)
- **Warning Orange**: #ffc107 (Warning states)
- **Info Blue**: #17a2b8 (Information states)

### Typography
- **Primary Font**: System fonts for optimal performance
- **Icon Font**: Bootstrap Icons for consistent iconography

### Components
- **Buttons**: Gold primary, dark secondary with hover effects
- **Cards**: Dark background with gold accents
- **Forms**: Dark theme with gold focus states
- **Tables**: Responsive with hover effects and sorting
- **Modals**: Dark theme with smooth animations

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
The page will reload when you make changes.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.
Optimizes the build for best performance.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## API Integration

The frontend communicates with the Laravel backend API:
- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: JWT tokens with automatic refresh
- **Error Handling**: Centralized error handling with user feedback
- **Loading States**: Visual feedback for all async operations

### API Services
- **authAPI**: User authentication and profile management
- **movieAPI**: Movie data and search
- **theaterAPI**: Theater information and listings
- **showtimeAPI**: Showtime data and seat management
- **bookingAPI**: Booking creation and management
- **adminAPI**: Admin operations for all entities

## Environment Configuration

Create a `.env` file in the frontend root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_APP_NAME=CineBook
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## Development Guidelines

### Code Standards
1. **File Naming**: Use PascalCase for React components (.jsx files)
2. **Styling**: Use Bootstrap classes with custom CSS for brand colors
3. **State Management**: Use React Hooks for local state, Context for global state
4. **API Calls**: Use the centralized API service with proper error handling
5. **Responsive Design**: Ensure all components work on mobile, tablet, and desktop

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { api } from '../services/api';

const ComponentName = () => {
  // State declarations
  const [loading, setLoading] = useState(false);
  
  // Effects and handlers
  useEffect(() => {
    // Component logic
  }, []);
  
  // Render
  return (
    <Container>
      {/* Component JSX */}
    </Container>
  );
};

export default ComponentName;
```

### Error Handling
- Use try-catch blocks for async operations
- Display user-friendly error messages
- Implement loading states for better UX
- Log errors for debugging

## Access Levels

### Admin Access
- **URL**: `/admin/login`
- **Credentials**: admin@cinebook.com / admin123
- **Features**: Full system management and analytics

### User Access
- **URL**: `/auth/login`
- **Registration**: Available for new users
- **Features**: Movie booking and profile management

## Key Features Implementation

### Real-time Seat Selection
- Interactive seat grid with live availability
- Automatic seat locking during selection
- Real-time updates from other users

### Advanced Admin Dashboard
- Revenue analytics with charts
- User activity monitoring
- System performance metrics
- Quick action buttons

### Mobile-First Design
- Responsive grid system
- Touch-friendly interfaces
- Optimized loading for mobile

### Progressive Web App Features
- Fast loading with code splitting
- Offline capability planning
- App-like user experience

## Performance Optimizations

- **Code Splitting**: Lazy loading for admin routes
- **Image Optimization**: Responsive images with lazy loading
- **API Optimization**: Debounced search and pagination
- **State Management**: Efficient re-rendering with React.memo
- **Bundle Size**: Tree shaking and minimal dependencies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Follow the established code style
2. Write meaningful commit messages
3. Test on multiple screen sizes
4. Ensure all API integrations work correctly
5. Update documentation for new features
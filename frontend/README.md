# CineBook Frontend

This is the ReactJS frontend for the CineBook movie booking system.

## Features

- User authentication (login/register)
- Movie browsing and search
- Theater information
- Showtime listings
- Seat selection and booking
- User profile management
- Booking history
- Admin dashboard for managing movies, theaters, showtimes, and bookings

## Tech Stack

- ReactJS 18
- React Router v6
- Bootstrap 5
- Axios for API calls

## Project Structure

```
src/
├── components/          # Reusable components
├── services/            # API service files
├── views/               # Page components
│   ├── admin/           # Admin pages
│   ├── auth/            # Authentication pages
│   ├── booking/         # Booking flow pages
│   └── ...              # Other pages
├── App.js               # Main app component with routing
├── index.js             # Entry point
└── index.css            # Global styles
```

## Color Theme

- Primary Black: #141414
- Primary Gold: #FFD700
- Primary White: #FFFFFF
- Secondary Dark: #2F2F2F
- Text Gray: #CCCCCC

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## API Integration

The frontend communicates with the Laravel backend API at `http://localhost:8000/api/v1`.

## Environment Variables

Create a `.env` file in the frontend root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Development Guidelines

1. All components should be created as .jsx files
2. Use Bootstrap classes for styling
3. Follow the black, gold, and white color theme
4. Implement proper error handling
5. Use the provided API service for all backend communication
6. Maintain responsive design for all components

## Admin Access

To access the admin dashboard, navigate to `/admin/login`.
Use admin credentials to log in.

## User Access

Regular users can access all public pages and authenticated pages after logging in.
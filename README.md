# VetBridge Web Platform

A modern Next.js web application for the VetBridge pet healthcare platform, connecting pet owners with veterinarians across Kenya.

## Features

- **Pet Owners**: Find vets, book appointments, manage pets, AI health assistant, marketplace
- **Veterinarians**: Dashboard, booking management, patient records, earnings tracking
- **Clinics**: Team management, analytics, booking oversight

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Lucide Icons
- Axios for API calls
- js-cookie for authentication

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd VetBridge-frontend/web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Render

1. Push your code to GitHub
2. Create new web service in Render
3. Connect your repository
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Set environment variables
7. Deploy

### Docker

Build the Docker image:
```bash
docker build -t vetbridge-web .
```

Run the container:
```bash
docker run -p 3000:3000 vetbridge-web
```

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Owner dashboard
│   ├── vets/              # Veterinarian marketplace
│   ├── book/              # Booking page
│   ├── pets/              # Pet management
│   ├── ai/                # AI assistant
│   ├── marketplace/       # Pet marketplace
│   ├── vet-dashboard/     # Veterinarian dashboard
│   ├── clinic-dashboard/  # Clinic dashboard
│   ├── notifications/     # Notifications
│   ├── layout.js          # Root layout
│   ├── page.js            # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/                # UI components (LoadingSpinner, StarRating, EmptyState)
├── lib/
│   ├── api.js             # API client
│   └── auth.js            # Authentication utilities
├── public/                # Static assets
├── Dockerfile             # Docker configuration
├── render.yaml            # Render deployment config
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies
```

## API Integration

The web platform connects to the VetBridge backend API. Update the `NEXT_PUBLIC_API_URL` environment variable to point to your backend.

## Authentication

Authentication uses JWT tokens stored in cookies and localStorage. The app supports three user roles:
- Owner (pet owners)
- Vet (veterinarians)
- Clinic (clinic owners)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

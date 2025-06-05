# VoxiFlow - Voice Bot Management System

A modern web application for managing voice bots and automated call campaigns. Built with React, TypeScript, and Tailwind CSS.

## Features

- Campaign Management
  - Create, edit, and delete voice bot campaigns
  - Configure voice settings and flow
  - Manage telephony settings
  - Post-call actions and data extraction

- Call History
  - Track and monitor call records
  - Filter and search functionality
  - Export call data to CSV

- Real-time Campaign Monitoring
  - View active campaigns
  - Monitor call status
  - Performance analytics

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Hook Form
- Zod Validation
- React Router

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/voicebot-vision-lab-1.git
   ```

2. Install dependencies:
   ```bash
   cd voicebot-vision-lab-1
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```
   VITE_API_URL=your_api_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── lib/           # Utility functions and hooks
└── assets/        # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

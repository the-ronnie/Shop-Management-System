# Shop Management System

![Shop Management System](https://img.shields.io/badge/Status-Development-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

A comprehensive inventory and shop management solution built with Next.js, TypeScript, MongoDB, and Tailwind CSS. This application helps retail businesses manage their inventory, track sales, generate bills, monitor credits, and analyze business operations through a user-friendly interface.

## 🚀 Features

- **Dashboard Overview** - Get a quick glance at key business metrics
- **Inventory Management** - Add, edit, and track your products
- **Low Stock Alerts** - Never run out of stock with automated alerts
- **Transaction Processing** - Record both purchases and sales in bulk
- **Billing System** - Create and print customer bills
- **Credit Management** - Track credit given to and taken from customers
- **Activity Logs** - Maintain a complete history of all operations
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 📸 Screenshots

*Coming soon*

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB
- **File Storage:** Local file system (configurable for cloud storage)
- **Icons:** React Icons (Feather Icons)

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- MongoDB instance (local or Atlas)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Shop-Management-System.git
cd Shop-Management-System
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/shop

# Base URL for the application (used for API calls)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Set a custom upload directory for product images
# UPLOAD_DIR=./public/uploads

# Optional: Set a JWT secret for authentication (for future use)
# JWT_SECRET=your-secret-key-here
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 5. Build for production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 🔧 Project Structure

```
Shop-Management-System/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── add-product/      # Add product page
│   │   ├── api/             # API routes
│   │   ├── billing/         # Billing page
│   │   ├── credits/         # Credit management page
│   │   ├── logs/            # Activity logs page
│   │   ├── low-stock/       # Low stock alerts page
│   │   ├── products/        # Product listing page
│   │   ├── transactions/    # Transactions page
│   │   ├── layout.tsx       # Main layout component
│   │   └── page.tsx         # Home page / Dashboard
│   ├── lib/           # Utility functions and configurations
│   ├── models/        # MongoDB models
│   └── components/    # Reusable components
├── .env.local        # Environment variables (create this)
├── .gitignore        # Git ignore file
├── next.config.js    # Next.js configuration
├── package.json      # Project dependencies
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json     # TypeScript configuration
```

## 🗄️ Database Structure

The application uses MongoDB with the following main collections:

- **products** - Store product information
- **transactions** - Record buy and sell transactions
- **bills** - Store customer bills
- **credits** - Track credit transactions
- **logs** - Record system activity

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/)
- [React Icons](https://react-icons.github.io/react-icons/)

## 📞 Contact

For questions or feedback, please reach out to:

- **Email**: your-email@example.com
- **GitHub**: [Your GitHub Profile](https://github.com/your-username)

## Learn More About Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
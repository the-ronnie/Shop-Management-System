import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "My Shop Inventory",
  description: "Manage your shop easily",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <nav className="bg-blue-600 text-white p-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6 font-medium">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/add-product" className="hover:underline">Add Product</Link>
              <Link href="/products" className="hover:underline">Products</Link>
              <Link href="/transactions" className="hover:underline">Transactions</Link>
              <Link href="/billing" className="hover:underline">Billing</Link>
              <Link href="/credits" className="hover:underline">Credits</Link>
              <Link href="/low-stock" className="hover:underline flex items-center">
                <span className="relative">
                  Low Stock
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">!</span>
                </span>
              </Link>
              <Link href="/logs" className="hover:underline">Activity Logs</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
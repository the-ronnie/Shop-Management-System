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
          <div className="max-w-5xl mx-auto flex flex-wrap gap-6 font-medium">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/add-product" className="hover:underline">Add Product</Link>
            <Link href="/products" className="hover:underline">Products</Link>
            <Link href="/transactions" className="hover:underline">Transactions</Link>
            <Link href="/billing" className="hover:underline">Billing</Link>
            <Link href="/credits" className="hover:underline">Credits</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
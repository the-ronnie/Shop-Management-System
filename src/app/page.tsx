export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">📦 My Shop Inventory System</h1>
      <p className="text-gray-700">
        Welcome! Use this system to manage your shop’s inventory, track purchases and sales, and handle billing and credits.
      </p>
      <ul className="list-disc pl-5 text-gray-800">
        <li>➕ Add new items with quantity and price</li>
        <li>📋 View and search all your products</li>
        <li>🔁 Record buy/sell actions (coming next)</li>
        <li>🔔 Get notified for low stock</li>
        <li>🧾 Generate bills and track credit (coming soon)</li>
      </ul>
    </div>
  );
}

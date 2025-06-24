"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
    image: "",
    description: "",
    category: ""
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const uploaded = acceptedFiles[0];
    if (!uploaded) return;

    setFile(uploaded);
    const previewUrl = URL.createObjectURL(uploaded);
    setPreview(previewUrl);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use local preview URL or fallback to empty
    const imageUrl = preview || "";

    const response = await fetch("/api/products/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        image: imageUrl,
        quantity: +formData.quantity,
        price: +formData.price
      }),
    });

    if (response.ok) {
      alert("✅ Product added!");
      setFormData({
        name: "",
        quantity: "",
        price: "",
        image: "",
        description: "",
        category: ""
      });
      setPreview(null);
      setFile(null);
    } else {
      const err = await response.json();
      alert("❌ Error: " + err.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Add Product</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {["name", "quantity", "price", "description", "category"].map((field) => (
          <input
            key={field}
            name={field}
            value={(formData as any)[field]}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required={["name", "quantity", "price"].includes(field)}
          />
        ))}

        {/* Image Upload */}
        <div
          {...getRootProps()}
          className="w-full border-2 border-dashed p-4 rounded cursor-pointer text-center"
        >
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="preview" className="h-40 mx-auto object-contain" />
          ) : (
            <p>📁 Drag & drop image here, or click to upload</p>
          )}
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          ➕ Add Product
        </button>
      </form>
    </div>
  );
}

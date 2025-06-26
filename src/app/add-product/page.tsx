"use client";

import { useState, ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AddProduct() {
  const router = useRouter();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
  };

  // Handle drag over for file drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    setFile(droppedFile);
    const previewUrl = URL.createObjectURL(droppedFile);
    setPreview(previewUrl);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // If we have a file, upload it first
    let imageUrl = "";
    
    if (file) {
      const uploadFormData = new FormData();
      uploadFormData.append("files", file);
      
      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        
        const uploadData = await uploadResponse.json();
        // Get the first uploaded file URL
        imageUrl = uploadData.files?.[0] || "";
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("❌ Error uploading image. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    // Now submit the product with the image URL
    try {
      const response = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl, // Use the uploaded image URL or empty string
          quantity: +formData.quantity,
          price: +formData.price
        }),
      });

      if (response.ok) {
        alert("✅ Product added successfully!");
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
        // Optionally redirect to products page
        // router.push("/products");
      } else {
        const err = await response.json();
        alert("❌ Error: " + err.message);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ Error adding product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Add Product</h1>
          <p className="text-gray-300">Create a new product entry for your inventory</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="h-2 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="p-8">
            <form className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Quantity & Price Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300"
                      placeholder="Enter product category"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 resize-vertical"
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Product Image
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fileInput')?.click()}
                      className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-black hover:bg-white hover:shadow-lg hover:-translate-y-1 bg-gray-50 min-h-[320px] flex flex-col items-center justify-center"
                    >
                      <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {preview ? (
                        <div className="relative w-full h-full min-h-[280px] rounded-lg overflow-hidden group">
                          <img 
                            src={preview} 
                            alt="preview" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById('fileInput')?.click();
                              }}
                              className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                            >
                              Change Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4">
                          <svg 
                            className="w-16 h-16 text-gray-400 transition-all duration-300 hover:text-black hover:scale-110" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                            />
                          </svg>
                          <div>
                            <h4 className="text-lg font-semibold text-black mb-1">
                              Upload Product Image
                            </h4>
                            <p className="text-gray-500 mb-2">
                              Drag & drop an image here, or click to browse
                            </p>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full border">
                              PNG, JPG, GIF up to 10MB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 flex items-center justify-center px-6 py-4 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg font-semibold hover:from-gray-800 hover:to-black transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Product
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
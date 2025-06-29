"use client";

import { useState, ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiPlus, FiUploadCloud, FiImage } from "react-icons/fi";

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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when field is edited
    if (errors[e.target.name]) {
      setErrors({...errors, [e.target.name]: ""});
    }
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
    e.currentTarget.classList.add('border-black', 'bg-gray-50');
  };

  // Handle drag leave
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-black', 'bg-gray-50');
  };

  // Handle file drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-black', 'bg-gray-50');
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    setFile(droppedFile);
    const previewUrl = URL.createObjectURL(droppedFile);
    setPreview(previewUrl);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Quantity cannot be negative";
    }
    
    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (parseFloat(formData.price) < 0) {
      newErrors.price = "Price cannot be negative";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
          image: imageUrl,
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
      {/* Responsive Header with breadcrumbs */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                <span>/</span>
                <span className="text-white">Add New</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Add Product</h1>
            </div>
            <Link 
              href="/products" 
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="h-1.5 bg-gradient-to-r from-black to-gray-700"></div>
          
          <div className="p-4 sm:p-6 md:p-8">
            <form className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                {/* Left Column - Product Details */}
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
                    Product Information
                  </h2>
                  
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border-2 ${errors.name ? 'border-red-300 ring-red-300' : 'border-gray-200'} rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm`}
                      placeholder="Enter product name"
                      required
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Quantity & Price Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 sm:px-4 sm:py-3 border-2 ${errors.quantity ? 'border-red-300 ring-red-300' : 'border-gray-200'} rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm`}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">₹</span>
                        </div>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className={`w-full pl-7 pr-3 py-2 sm:px-4 sm:py-3 sm:pl-8 border-2 ${errors.price ? 'border-red-300 ring-red-300' : 'border-gray-200'} rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 shadow-sm"
                      placeholder="Enter product category"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 resize-vertical shadow-sm"
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>

                {/* Right Column - Image Upload */}
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">
                    Product Image
                  </h2>
                  
                  {/* Image Upload */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Upload an image to make your product stand out
                    </p>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fileInput')?.click()}
                      className="border-3 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 hover:border-black hover:bg-gray-50 hover:shadow-md min-h-[240px] sm:min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden"
                    >
                      <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {preview ? (
                        <div className="absolute inset-0 w-full h-full">
                          <div className="relative w-full h-full min-h-[240px] sm:min-h-[300px] group">
                            <img 
                              src={preview} 
                              alt="preview" 
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document.getElementById('fileInput')?.click();
                                }}
                                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 mb-2"
                              >
                                <FiImage className="inline mr-2" />
                                Change Image
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreview(null);
                                  setFile(null);
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
                              >
                                Remove Image
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="bg-gray-100 p-4 rounded-full">
                            <FiUploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-1">
                              Drag & drop image here
                            </h4>
                            <p className="text-sm text-gray-500 mb-2">
                              or click to browse files
                            </p>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border">
                              PNG, JPG, GIF up to 10MB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional tips */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <h3 className="font-medium text-blue-800 mb-1">Tips for great product images</h3>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Use a clean background</li>
                      <li>Show the product clearly</li>
                      <li>Use natural lighting when possible</li>
                      <li>Optimal dimensions: 1000x1000px</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 border-2 border-black text-black rounded-lg font-medium hover:bg-black hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-2" />
                        Add Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
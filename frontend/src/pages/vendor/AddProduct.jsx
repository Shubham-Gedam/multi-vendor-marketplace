import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../services/productService";

export default function AddProduct() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    stock: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function handleImageChange(e) {
    const selectedImages = Array.from(e.target.files || []);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (selectedImages.length > 5) {
      setError("You can upload a maximum of 5 images.");
      setImages([]);
      e.target.value = "";
      return;
    }

    const oversizedImage = selectedImages.find(
      (image) => image.size > MAX_FILE_SIZE,
    );

    if (oversizedImage) {
      setError(
        `${oversizedImage.name} exceeds the 5 MB limit. Please compress the image.`,
      );
      setImages([]);
      e.target.value = "";
      return;
    }

    setError("");
    setImages(selectedImages);
  }
  async function handleSubmit(e) {
    e.preventDefault();

    if (images.length > 5) {
      setError("Maximum 5 images are allowed.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const productData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        productData.append(key, value);
      });

      images.forEach((image) => {
        productData.append("images", image);
      });

      await createProduct(productData);

      alert("Product created successfully!");

      navigate("/vendor/products");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create product");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

  const labelClass = "mb-2 block text-sm font-bold text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-9 text-white sm:px-10">
          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY SELLER CENTER
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Add New Product
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
            Add your products to the marketplace and make them available to
            customers.
          </p>
        </div>

        {/* FORM LAYOUT */}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
          {/* PRODUCT FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="mb-7 border-b border-slate-100 pb-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Product Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Provide accurate details about your product.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* PRODUCT NAME */}

            <div className="mb-6">
              <label htmlFor="name" className={labelClass}>
                Product Name *
              </label>

              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="mb-6">
              <label htmlFor="description" className={labelClass}>
                Product Description *
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Describe your product..."
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
                rows={5}
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* PRICE AND STOCK */}

            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className={labelClass}>
                  Price (₹) *
                </label>

                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="stock" className={labelClass}>
                  Available Stock *
                </label>

                <input
                  id="stock"
                  type="number"
                  name="stock"
                  placeholder="Enter quantity"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* CATEGORY AND BRAND */}

            <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Category *
                </label>

                <input
                  id="category"
                  type="text"
                  name="category"
                  placeholder="e.g. Electronics"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="brand" className={labelClass}>
                  Brand
                </label>

                <input
                  id="brand"
                  type="text"
                  name="brand"
                  placeholder="e.g. Logitech"
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* IMAGE UPLOAD */}

            <div className="border-t border-slate-100 pt-7">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Product Images
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Upload up to 5 product images.
                </p>
              </div>

              <label
                htmlFor="images"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-5 py-10 text-center transition hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="text-5xl">📸</span>

                <span className="mt-4 text-sm font-bold text-blue-700">
                  Click to upload product images
                </span>

                <span className="mt-2 text-xs text-slate-500">
                  Select image files from your device
                </span>

                <span className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  Maximum 5 images
                </span>

                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={loading}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {/* SELECTED IMAGES */}

              {images.length > 0 && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-green-800">
                      Selected Images
                    </h4>

                    <span className="text-xs font-semibold text-green-700">
                      {images.length}/5
                    </span>
                  </div>

                  <div className="space-y-2">
                    {images.map((image, index) => (
                      <div
                        key={`${image.name}-${index}`}
                        className="flex items-center gap-3 rounded-lg bg-white p-3"
                      >
                        <span className="text-xl">🖼️</span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {image.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {(image.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        <span className="text-green-600">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}

            <div className="mt-8 border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 py-4 font-extrabold text-slate-950 shadow-sm transition hover:bg-yellow-300 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                    Creating Product...
                  </>
                ) : (
                  "Create Product →"
                )}
              </button>

              <p className="mt-4 text-center text-xs text-slate-400">
                Your product will be uploaded to the marketplace after
                successful submission.
              </p>
            </div>
          </form>

          {/* INFORMATION SIDEBAR */}

          <aside className="space-y-5">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="font-extrabold text-slate-900">
                Product Listing Tips
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">✍️</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Use a clear and descriptive product name.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">📸</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Upload good-quality images of your product.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">💰</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Enter an accurate selling price.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">📦</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Keep the available stock quantity updated.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">☁️</span>

                <h3 className="font-extrabold text-slate-900">AWS S3 Upload</h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Product images are uploaded through your existing backend S3
                integration.
              </p>

              <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-700">
                ✓ Image upload integration configured
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

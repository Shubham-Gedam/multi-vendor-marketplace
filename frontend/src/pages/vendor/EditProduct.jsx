import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProductById,
  updateProduct,
} from "../../services/productService";

export default function EditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    stock: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await getProductById(productId);
        const product = response.data;

        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price ?? "",
          category: product.category || "",
          brand: product.brand || "",
          stock: product.stock ?? "",
        });

        setExistingImages(product.images || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load product"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleImageChange(e) {
    const selectedImages = Array.from(e.target.files || []);

    if (selectedImages.length > 5) {
      setError("Maximum 5 images are allowed.");
      setImages([]);
      e.target.value = "";
      return;
    }

    setError("");
    setImages(selectedImages);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setUpdating(true);
      setError("");

      const productData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        productData.append(key, value);
      });

      images.forEach((image) => {
        productData.append("images", image);
      });

      await updateProduct(productId, productData);

      navigate("/vendor/products");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update product"
      );
    } finally {
      setUpdating(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

  const labelClass =
    "mb-2 block text-sm font-bold text-slate-700";

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="mt-8 h-96 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  // Error state
  if (!formData.name && error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">📦</span>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
          Unable to Load Product
        </h2>

        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>

        <Link
          to="/vendor/products"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
        >
          Back to My Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 px-6 py-9 text-white sm:px-10">

          <p className="text-xs font-bold tracking-[2px] text-blue-200">
            MARKETLY SELLER CENTER
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Edit Product
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
            Update your product information, pricing, inventory
            and product images.
          </p>

          <Link
            to="/vendor/products"
            className="mt-5 inline-flex text-sm font-semibold text-blue-100 transition hover:text-white"
          >
            ← Back to My Products
          </Link>

        </div>

        {/* MAIN LAYOUT */}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">

          {/* EDIT FORM */}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >

            <div className="mb-7 border-b border-slate-100 pb-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Product Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Make changes to your existing product.
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
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={updating}
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
                placeholder="Product Description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={updating}
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
                  disabled={updating}
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
                  placeholder="Available Stock"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  disabled={updating}
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
                  placeholder="Category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={updating}
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
                  placeholder="Brand"
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={updating}
                  className={inputClass}
                />
              </div>

            </div>

            {/* CURRENT IMAGES */}

            <div className="border-t border-slate-100 pt-7">

              <h3 className="text-lg font-extrabold text-slate-900">
                Current Product Images
              </h3>

              {existingImages.length > 0 ? (

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">

                  {existingImages.map((image, index) => {
                    const imageUrl =
                      typeof image === "string"
                        ? image
                        : image?.url || image?.location;

                    return (
                      <div
                        key={index}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <div className="flex h-32 items-center justify-center p-2">
                          <img
                            src={imageUrl}
                            alt={`Product ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <p className="border-t border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-500">
                          Image {index + 1}
                        </p>
                      </div>
                    );
                  })}

                </div>

              ) : (

                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                  <span className="text-4xl">📦</span>

                  <p className="mt-3 text-sm text-slate-500">
                    No product images uploaded yet.
                  </p>

                </div>

              )}

            </div>

            {/* REPLACE IMAGES */}

            <div className="mt-7 border-t border-slate-100 pt-7">

              <h3 className="text-lg font-extrabold text-slate-900">
                Replace Product Images
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select new images to replace the current images.
                Leave this section empty to keep the existing images.
              </p>

              <label
                htmlFor="images"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-5 py-9 text-center transition hover:border-blue-500 hover:bg-blue-50"
              >

                <span className="text-5xl">📸</span>

                <span className="mt-4 text-sm font-bold text-blue-700">
                  Click to upload new images
                </span>

                <span className="mt-2 text-xs text-slate-500">
                  Maximum 5 images
                </span>

                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={updating}
                  onChange={handleImageChange}
                  className="hidden"
                />

              </label>

              {/* SELECTED IMAGES */}

              {images.length > 0 && (

                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                  <div className="mb-3 flex justify-between">
                    <h4 className="text-sm font-bold text-green-800">
                      New Images Selected
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

            {/* UPDATE BUTTON */}

            <div className="mt-8 border-t border-slate-100 pt-6">

              <button
                type="submit"
                disabled={updating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 py-4 font-extrabold text-slate-950 shadow-sm transition hover:bg-yellow-300 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {updating ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                    Updating Product...
                  </>
                ) : (
                  "Save Product Changes →"
                )}
              </button>

              <Link
                to="/vendor/products"
                className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel and Go Back
              </Link>

            </div>

          </form>

          {/* INFORMATION SIDEBAR */}

          <aside className="space-y-5">

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <h3 className="font-extrabold text-slate-900">
                Update Guidelines
              </h3>

              <div className="mt-5 space-y-4">

                <div className="flex items-start gap-3">
                  <span className="text-xl">✏️</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Keep product information accurate and updated.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">💰</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Review product pricing before saving changes.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl">📦</span>

                  <p className="text-xs leading-6 text-slate-600">
                    Maintain correct stock quantities.
                  </p>
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">
                <span className="text-3xl">☁️</span>

                <h3 className="font-extrabold text-slate-900">
                  AWS S3 Images
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                New images are uploaded to your existing S3
                integration when you save the product.
              </p>

              <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-700">
                ✓ Existing images remain unchanged unless replaced
              </div>

            </div>

          </aside>

        </div>

      </div>

    </div>
  );
}
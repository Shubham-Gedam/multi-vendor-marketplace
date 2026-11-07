import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getProductById } from "../../services/productService";

import {
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  getMyProductReview,
} from "../../services/productService";

import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../services/cartService";

const initialReviewForm = {
  rating: 5,
  title: "",
  comment: "",
};

function StarRating({ rating = 0, size = "text-lg" }) {
  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(Number(rating))
              ? "text-amber-400"
              : "text-slate-200"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

function getProductImage(product) {
  const image = product.images?.[0];

  if (typeof image === "string") return image;

  return image?.url || image?.location || "";
}

function formatDate(date) {
  if (!date) return "Recently";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // PRODUCT STATE

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CART STATE

  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  // REVIEW STATE

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState(null);

  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");

  const [myReview, setMyReview] = useState(null);
  const [myReviewLoading, setMyReviewLoading] = useState(false);

  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [isEditingReview, setIsEditingReview] = useState(false);

  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewActionError, setReviewActionError] = useState("");

  const isCustomer = user?.role === "CUSTOMER";

  // LOAD PRODUCT

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await getProductById(productId);

        if (!ignore) {
          setProduct(response.data);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Unable to load product details"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    setProduct(null);
    loadProduct();

    return () => {
      ignore = true;
    };
  }, [productId]);

  // LOAD PRODUCT REVIEWS

  const loadReviews = useCallback(
    async (page = 1) => {
      try {
        setReviewLoading(true);
        setReviewError("");

        const response = await getProductReviews(productId, {
          page,
          limit: 5,
        });

        setReviews(response.data || []);
        setReviewSummary(response.summary || null);
        setReviewPagination(response.pagination || null);
      } catch (err) {
        setReviewError(
          err.response?.data?.message ||
            "Unable to load product reviews"
        );
      } finally {
        setReviewLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    setReviews([]);
    setReviewSummary(null);
    setReviewPage(1);

    loadReviews(1);
  }, [productId, loadReviews]);

  // LOAD CURRENT CUSTOMER REVIEW

  useEffect(() => {
    let ignore = false;

    async function loadMyReview() {
      if (!isCustomer) {
        setMyReview(null);
        setMyReviewLoading(false);
        return;
      }

      try {
        setMyReviewLoading(true);

        const response = await getMyProductReview(productId);

        if (!ignore) {
          setMyReview(response.data || null);
        }
      } catch (err) {
        if (!ignore) {
          setMyReview(null);
        }
      } finally {
        if (!ignore) {
          setMyReviewLoading(false);
        }
      }
    }

    setMyReview(null);
    setIsEditingReview(false);
    setReviewForm(initialReviewForm);

    loadMyReview();

    return () => {
      ignore = true;
    };
  }, [productId, isCustomer, user?.userId]);

  // ADD TO CART

  async function handleAddToCart() {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "CUSTOMER") {
      setCartError("Only customers can add products to cart");
      return;
    }

    try {
      setAdding(true);
      setCartError("");
      setCartMessage("");

      await addToCart(product._id, 1);

      setCartMessage("Product added to cart successfully!");
    } catch (error) {
      setCartError(
        error.response?.data?.message ||
          "Unable to add product to cart"
      );
    } finally {
      setAdding(false);
    }
  }

  // HANDLE REVIEW INPUT

  function handleReviewChange(e) {
    const { name, value } = e.target;

    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // EDIT REVIEW

  function handleEditReview() {
    if (!myReview) return;

    setReviewForm({
      rating: myReview.rating,
      title: myReview.title,
      comment: myReview.comment,
    });

    setIsEditingReview(true);
    setReviewSuccess("");
    setReviewActionError("");

    document.getElementById("review-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  // CANCEL REVIEW EDIT

  function handleCancelEdit() {
    setIsEditingReview(false);
    setReviewForm(initialReviewForm);
    setReviewActionError("");
  }

  // SUBMIT / UPDATE REVIEW

  async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "CUSTOMER") {
      setReviewActionError(
        "Only customers can submit product reviews."
      );
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      setReviewActionError(
        "Please enter both review title and comment."
      );
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewActionError("");
      setReviewSuccess("");

      const payload = {
        rating: Number(reviewForm.rating),
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      };

      let response;

      if (myReview && isEditingReview) {
        response = await updateProductReview(
          myReview._id,
          payload
        );
      } else {
        response = await createProductReview(
          productId,
          payload
        );
      }

      setMyReview(response.data || null);

      setReviewSummary(response.summary || null);

      if (response.summary) {
        setProduct((prev) => ({
          ...prev,
          averageRating: response.summary.averageRating,
          numReviews: response.summary.numReviews,
        }));
      }

      setIsEditingReview(false);
      setReviewForm(initialReviewForm);

      setReviewSuccess(
        isEditingReview
          ? "Your review has been updated successfully!"
          : "Your review has been submitted successfully!"
      );

      await loadReviews(1);
      setReviewPage(1);
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message ||
          "Unable to submit your review"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  // DELETE REVIEW

  async function handleDeleteReview() {
    if (!myReview) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    try {
      setReviewSubmitting(true);
      setReviewActionError("");
      setReviewSuccess("");

      const response = await deleteProductReview(myReview._id);

      setMyReview(null);
      setReviewForm(initialReviewForm);
      setIsEditingReview(false);

      setReviewSummary(response.summary || null);

      if (response.summary) {
        setProduct((prev) => ({
          ...prev,
          averageRating: response.summary.averageRating,
          numReviews: response.summary.numReviews,
        }));
      }

      setReviewSuccess("Your review has been deleted successfully.");

      await loadReviews(1);
      setReviewPage(1);
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message ||
          "Unable to delete your review"
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  // REVIEW PAGINATION

  async function handleReviewPage(nextPage) {
    setReviewPage(nextPage);

    await loadReviews(nextPage);

    document.getElementById("customer-reviews")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // RATING SUMMARY

  const averageRating =
    reviewSummary?.averageRating ??
    product?.averageRating ??
    0;

  const totalReviews =
    reviewSummary?.numReviews ??
    product?.numReviews ??
    0;

  // LOADING STATE

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-10 sm:px-8">
        <div className="mb-8 h-5 w-40 rounded bg-slate-200" />

        <div className="grid gap-10 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-2 lg:p-10">
          <div className="h-80 rounded-xl bg-slate-200 sm:h-[450px]" />

          <div className="space-y-5">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-10 w-3/4 rounded bg-slate-200" />
            <div className="h-8 w-40 rounded bg-slate-200" />
            <div className="h-20 rounded bg-slate-200" />
            <div className="h-12 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
        <span className="text-6xl">📦</span>

        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
          Product Not Found
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          {error || "This product is currently unavailable."}
        </p>

        <Link
          to="/products"
          className="mt-6 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700"
        >
          ← Back to Products
        </Link>
      </div>
    );
  }

  const productImage = getProductImage(product);

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}

        <div className="mb-7 flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/"
            className="font-medium text-slate-500 hover:text-blue-600"
          >
            Home
          </Link>

          <span className="text-slate-300">/</span>

          <Link
            to="/products"
            className="font-medium text-slate-500 hover:text-blue-600"
          >
            Products
          </Link>

          <span className="text-slate-300">/</span>

          <span className="max-w-[180px] truncate font-semibold text-slate-800">
            {product.name}
          </span>
        </div>

        {/* PRODUCT DETAILS */}

        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">

          {/* PRODUCT IMAGE */}

          <div className="flex min-h-[320px] items-center justify-center bg-slate-50 p-6 sm:min-h-[500px] sm:p-12">

            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                className="max-h-[450px] w-full object-contain transition duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-8xl">📦</span>

                <p className="mt-5 text-sm font-medium text-slate-400">
                  No Image Available
                </p>
              </div>
            )}

          </div>

          {/* PRODUCT INFORMATION */}

          <div className="flex flex-col p-6 sm:p-10 lg:p-12">

            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
              {product.brand || "MARKETLY COLLECTION"}
            </p>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* CATEGORY AND RATING */}

            <div className="mt-4 flex flex-wrap items-center gap-3">

              <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
                {product.category}
              </span>

              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} size="text-sm" />

                <span className="text-sm font-bold text-slate-700">
                  {Number(averageRating).toFixed(1)}
                </span>

                <a
                  href="#customer-reviews"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  ({totalReviews} reviews)
                </a>
              </div>

            </div>

            {/* PRICE */}

            <div className="mt-8 border-y border-slate-100 py-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Price
              </p>

              <h2 className="mt-2 text-4xl font-extrabold text-slate-900">
                {formatPrice(product.price)}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Inclusive of applicable charges
              </p>

            </div>

            {/* DESCRIPTION */}

            <div className="mt-7">

              <h3 className="text-base font-bold text-slate-900">
                Product Description
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {product.description}
              </p>

            </div>

            {/* STOCK */}

            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center justify-between gap-3">

                <span className="text-sm font-semibold text-slate-700">
                  Availability
                </span>

                {product.stock > 0 ? (
                  <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    In Stock
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600">
                    Out of Stock
                  </span>
                )}

              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">

                <span className="text-sm text-slate-500">
                  Available Quantity
                </span>

                <span className="font-bold text-slate-900">
                  {product.stock} Units
                </span>

              </div>

            </div>

            {/* CART FEEDBACK */}

            {cartMessage && (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                ✓ {cartMessage}

                <Link to="/cart" className="ml-2 underline">
                  View Cart
                </Link>
              </div>
            )}

            {cartError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {cartError}
              </div>
            )}

            {/* ADD TO CART */}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || product.stock <= 0}
              className="mt-7 w-full rounded-xl bg-yellow-400 py-4 text-base font-extrabold text-slate-950 shadow-md transition hover:bg-yellow-300 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:text-lg"
            >
              {adding
                ? "Adding to Cart..."
                : product.stock <= 0
                  ? "Out of Stock"
                  : "🛒 Add to Cart"}
            </button>

            {/* ADDITIONAL INFO */}

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">

              <div>
                <span className="text-xl">🔒</span>

                <p className="mt-2 text-xs font-bold text-slate-800">
                  Secure Shopping
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Safe checkout experience
                </p>
              </div>

              <div>
                <span className="text-xl">📦</span>

                <p className="mt-2 text-xs font-bold text-slate-800">
                  Order Tracking
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Track your purchases
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ================================== */}
        {/* CUSTOMER REVIEWS */}
        {/* ================================== */}

        <section
          id="customer-reviews"
          className="mt-10 scroll-mt-40"
        >

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

            {/* REVIEW SECTION HEADER */}

            <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  CUSTOMER FEEDBACK
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  Customer Reviews
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  See what customers think about this product.
                </p>
              </div>

              {/* RATING SUMMARY */}

              <div className="rounded-xl bg-amber-50 px-6 py-4 text-center">

                <h3 className="text-3xl font-extrabold text-slate-900">
                  {Number(averageRating).toFixed(1)}
                  <span className="text-base text-slate-400">/5</span>
                </h3>

                <div className="mt-1 flex justify-center">
                  <StarRating rating={averageRating} />
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Based on {totalReviews} reviews
                </p>

              </div>

            </div>

            {/* REVIEW FEEDBACK */}

            {reviewSuccess && (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                ✓ {reviewSuccess}
              </div>
            )}

            {reviewActionError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                ⚠️ {reviewActionError}
              </div>
            )}

            {/* CUSTOMER REVIEW FORM */}

            <div id="review-form" className="mt-7">

              {isCustomer && !myReviewLoading && !myReview && (

                <form
                  onSubmit={handleReviewSubmit}
                  className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6"
                >

                  <h3 className="text-lg font-extrabold text-slate-900">
                    Write a Product Review
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Share your experience with other customers.
                  </p>

                  {/* STAR SELECTOR */}

                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Your Rating
                    </label>

                    <div className="flex items-center gap-2">

                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} stars`}
                          onClick={() => {
                            setReviewForm((prev) => ({
                              ...prev,
                              rating: star,
                            }));
                          }}
                          className={`text-3xl transition hover:scale-110 ${
                            star <= reviewForm.rating
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}

                      <span className="ml-2 text-xs font-bold text-slate-500">
                        {reviewForm.rating}/5
                      </span>

                    </div>

                  </div>

                  {/* REVIEW TITLE */}

                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Review Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={reviewForm.title}
                      onChange={handleReviewChange}
                      placeholder="Summarize your experience"
                      maxLength={100}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  {/* REVIEW COMMENT */}

                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Your Review
                    </label>

                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      placeholder="Tell other customers about your experience..."
                      rows={4}
                      maxLength={1000}
                      required
                      className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {reviewForm.comment.length}/1000 characters
                    </p>

                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="mt-5 rounded-lg bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewSubmitting
                      ? "Submitting..."
                      : "Submit Review"}
                  </button>

                </form>

              )}

              {/* EDIT EXISTING REVIEW */}

              {isCustomer && myReview && !isEditingReview && (

                <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div>
                      <h3 className="font-extrabold text-green-800">
                        ✓ You have reviewed this product
                      </h3>

                      <p className="mt-1 text-sm text-green-700">
                        You can update or remove your review.
                      </p>
                    </div>

                    <div className="flex gap-3">

                      <button
                        type="button"
                        onClick={handleEditReview}
                        disabled={reviewSubmitting}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Edit Review
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteReview}
                        disabled={reviewSubmitting}
                        className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                  <div className="mt-4 rounded-lg bg-white p-4">

                    <StarRating rating={myReview.rating} />

                    <h4 className="mt-2 font-bold text-slate-900">
                      {myReview.title}
                    </h4>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {myReview.comment}
                    </p>

                  </div>

                </div>

              )}

              {/* UPDATE FORM */}

              {isCustomer && myReview && isEditingReview && (

                <form
                  onSubmit={handleReviewSubmit}
                  className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6"
                >

                  <h3 className="text-lg font-extrabold text-slate-900">
                    Edit Your Review
                  </h3>

                  <div className="mt-5">

                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Your Rating
                    </label>

                    <div className="flex items-center gap-2">

                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} stars`}
                          onClick={() => {
                            setReviewForm((prev) => ({
                              ...prev,
                              rating: star,
                            }));
                          }}
                          className={`text-3xl transition hover:scale-110 ${
                            star <= reviewForm.rating
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}

                    </div>

                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Review Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={reviewForm.title}
                      onChange={handleReviewChange}
                      maxLength={100}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Review Description
                    </label>

                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      rows={4}
                      maxLength={1000}
                      required
                      className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {reviewSubmitting
                        ? "Updating..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={reviewSubmitting}
                      className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              )}

              {/* GUEST MESSAGE */}

              {!user && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">

                  <h3 className="font-extrabold text-slate-900">
                    Share Your Experience
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Login with your customer account to write a review.
                  </p>

                  <Link
                    to="/login"
                    className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Login to Review
                  </Link>

                </div>
              )}

              {/* NON-CUSTOMER MESSAGE */}

              {user && !isCustomer && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Product reviews can only be submitted using a Customer account.
                </div>
              )}

              {isCustomer && myReviewLoading && (
                <p className="text-sm text-slate-400">
                  Checking your review...
                </p>
              )}

            </div>

            {/* REVIEWS LIST */}

            <div className="mt-9 border-t border-slate-100 pt-7">

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    All Customer Reviews
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {totalReviews} reviews for this product
                  </p>
                </div>

                {reviews.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                    Latest Reviews
                  </span>
                )}

              </div>

              {/* REVIEW LOADING */}

              {reviewLoading ? (

                <div className="animate-pulse space-y-4">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-32 rounded-xl bg-slate-100"
                    />
                  ))}
                </div>

              ) : reviewError ? (

                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {reviewError}

                  <button
                    type="button"
                    onClick={() => loadReviews(reviewPage)}
                    className="ml-3 font-bold underline"
                  >
                    Retry
                  </button>
                </div>

              ) : reviews.length === 0 ? (

                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">

                  <span className="text-5xl">⭐</span>

                  <h4 className="mt-4 text-base font-extrabold text-slate-800">
                    No Reviews Yet
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Be the first customer to share your experience.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {reviews.map((review) => (

                    <article
                      key={review._id}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-100 hover:shadow-sm"
                    >

                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-extrabold text-blue-700">
                            {review.customerId?.charAt(0)?.toUpperCase() || "C"}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {review.customerId === user?.userId
                                ? "You"
                                : "Customer"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>

                        </div>

                        <StarRating rating={review.rating} />

                      </div>

                      <h4 className="mt-4 font-extrabold text-slate-900">
                        {review.title}
                      </h4>

                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {review.comment}
                      </p>

                      {review.updatedAt !== review.createdAt && (
                        <p className="mt-3 text-[11px] text-slate-400">
                          Edited on {formatDate(review.updatedAt)}
                        </p>
                      )}

                    </article>

                  ))}

                </div>

              )}

              {/* REVIEW PAGINATION */}

              {!reviewLoading &&
                !reviewError &&
                reviewPagination?.totalPages > 1 && (

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <p className="text-xs font-semibold text-slate-500">
                      Page {reviewPagination.currentPage} of{" "}
                      {reviewPagination.totalPages}
                    </p>

                    <div className="flex gap-3">

                      <button
                        type="button"
                        disabled={!reviewPagination.hasPrevPage}
                        onClick={() =>
                          handleReviewPage(reviewPage - 1)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-500 disabled:opacity-40"
                      >
                        ← Previous
                      </button>

                      <button
                        type="button"
                        disabled={!reviewPagination.hasNextPage}
                        onClick={() =>
                          handleReviewPage(reviewPage + 1)
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
                      >
                        Next →
                      </button>

                    </div>

                  </div>

                )}

            </div>

          </div>

        </section>

        {/* BACK TO PRODUCTS */}

        <div className="mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-bold text-blue-600 transition hover:text-blue-800"
          >
            ← Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
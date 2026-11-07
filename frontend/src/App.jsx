import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CustomerLayout from "./layouts/CustomerLayout";
import VendorLayout from "./layouts/VendorLayout";
import AdminLayout from "./layouts/AdminLayout";

import ProtectedRoute from "./components/common/ProtectedRoute";

// Customer pages
import Home from "./pages/customer/Home";
import Products from "./pages/customer/Products";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import OrderDetails from "./pages/customer/OrderDetails";
import Profile from "./pages/customer/Profile";

// Vendor pages
import VendorApplication from "./pages/vendor/VendorApplication";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import AddProduct from "./pages/vendor/AddProduct";
import EditProduct from "./pages/vendor/EditProduct";
import VendorOrders from "./pages/vendor/VendorOrders";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageVendors from "./pages/admin/ManageVendors";
import ManageOrders from "./pages/admin/ManageOrders";
import ManagePayments from "./pages/admin/ManagePayments";
import ManageCoupons from "./pages/admin/ManageCoupons";

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer Panel */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER", "VENDOR", "ADMIN"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/products" element={<Products />} />

        <Route path="/products/:productId" element={<ProductDetails />} />

        <Route
          path="/vendor/apply"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <VendorApplication />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Vendor Panel */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={["VENDOR"]}>
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VendorDashboard />} />

        <Route path="products" element={<VendorProducts />} />

        <Route path="products/add" element={<AddProduct />} />

        <Route path="products/edit/:productId" element={<EditProduct />} />

        <Route path="orders" element={<VendorOrders />} />
      </Route>

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />

        <Route path="vendors" element={<ManageVendors />} />

        <Route path="orders" element={<ManageOrders />} />

        <Route path="payments" element={<ManagePayments />} />

        <Route path="coupons" element={<ManageCoupons />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;

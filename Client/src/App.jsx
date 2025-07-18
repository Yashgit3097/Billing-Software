import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
const baseUrl = "https://billing-software-3j1q.onrender.com"
// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuth = (boolean, userData = null) => {
    setIsAuthenticated(boolean);
    if (userData) setUser(userData);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get('token'); // ✅ Read token from cookie
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const response = await fetch(`${baseUrl}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
          setAuth(true, data.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div className="text-center py-10">Checking authentication...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login setAuth={setAuth} /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register setAuth={setAuth} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard user={user} setAuth={setAuth} /> : <Navigate to="/login" />} />
          <Route path="/products" element={isAuthenticated ? <Products user={user} /> : <Navigate to="/login" />} />
          <Route path="/create-bill" element={isAuthenticated ? <CreateBill user={user} /> : <Navigate to="/login" />} />
          <Route path="/bill-history" element={isAuthenticated ? <BillHistory user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

// Login Component
function Login({ setAuth }) {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ mobileNumber: '', password: '' });

  const handleChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setAuth(true, data.user);
        navigate('/');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center text-gray-900">Login to Your Account</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                required
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your mobile number"
                value={inputs.mobileNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={inputs.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
// Register Component
function Register({ setAuth }) {
  const [inputs, setInputs] = useState({
    shopNameEnglish: '',
    mobileNumber: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setAuth(true, data.user);
        navigate('/');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create Your Account</h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="shopNameEnglish" className="block text-sm font-medium text-gray-700">Shop Name (English)</label>
              <input
                id="shopNameEnglish"
                name="shopNameEnglish"
                type="text"
                required
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter shop name in English"
                value={inputs.shopNameEnglish}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                required
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your mobile number"
                value={inputs.mobileNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={inputs.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
// Dashboard Component
function Dashboard({ user, setAuth }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false, null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.preferredLanguage === 'gu' ? 'ડેશબોર્ડ' : 'Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {user.shopNameEnglish} | {user.mobileNumber}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {user.preferredLanguage === 'gu' ? 'લોગ આઉટ' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/products"
              className="overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.preferredLanguage === 'gu' ? 'ઉત્પાદનો' : 'Products'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user.preferredLanguage === 'gu' ? 'તમારા ઉત્પાદનો મેનેજ કરો' : 'Manage your products'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/create-bill"
              className="overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-100 rounded-md">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.preferredLanguage === 'gu' ? 'બિલ બનાવો' : 'Create Bill'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user.preferredLanguage === 'gu' ? 'નવું બિલ જનરેટ કરો' : 'Generate a new bill'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/bill-history"
              className="overflow-hidden bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-md">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.preferredLanguage === 'gu' ? 'બિલ ઇતિહાસ' : 'Bill History'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user.preferredLanguage === 'gu' ? 'પાછલા બિલ જુઓ' : 'View previous bills'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
// Products Component with Dashboard Navigation
function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    nameEnglish: '',
    price: '',
    quantity: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${baseUrl}/${editingId}`
        : `${baseUrl}/api/products`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      const updatedProduct = await response.json();

      if (editingId) {
        setProducts(products.map(p => p._id === editingId ? updatedProduct : p));
      } else {
        setProducts([...products, updatedProduct]);
      }

      setFormData({ nameEnglish: '', price: '', quantity: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      nameEnglish: product.nameEnglish,
      price: product.price,
      quantity: product.quantity
    });
    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Products</h1>
        </div>
        <Link to="/create-bill" className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
          Create Bill
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Name (English)</label>
              <input
                type="text"
                name="nameEnglish"
                value={formData.nameEnglish}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ nameEnglish: '', price: '', quantity: '' });
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Your Products</h2>
          {products.length === 0 ? (
            <p className="text-gray-500">No products added yet.</p>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.nameEnglish}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CreateBill Component with Dashboard Navigation
function CreateBill({ user }) {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [quantityInputs, setQuantityInputs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const addProduct = product => {
    const existingProduct = selectedProducts.find(p => p.productId === product._id);
    if (existingProduct) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === product._id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product._id,
          name: product.nameEnglish,
          price: product.price,
          quantity: 1
        }
      ]);
    }
    setQuantityInputs(prev => ({ ...prev, [product._id]: '1' }));
  };

  const handleQuantityChange = (productId, value) => {
    setQuantityInputs(prev => ({ ...prev, [productId]: value }));
    const newQuantity = value === '' ? 0 : Math.max(1, Math.floor(Number(value)) || 1);
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    setQuantityInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[productId];
      return newInputs;
    });
  };

  const generateBill = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customerName,
          customerMobile,
          items: selectedProducts
        })
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        navigate('/bill-history');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  return (
    <div className="container px-2 sm:px-4 py-4 sm:py-8 mx-auto min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link to="/" className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
            ← Dashboard
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold">Create New Bill</h1>
        </div>
        <Link to="/products" className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">
          View Products
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 flex-grow overflow-hidden">
        {/* Products List - Left Column */}
        <div className="lg:w-2/3 h-full flex flex-col">
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow flex-grow overflow-y-auto">
            <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold sticky top-0 bg-white py-2">Available Products</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pb-4">
              {products.map(product => (
                <div key={product._id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-sm sm:text-base font-medium">{product.nameEnglish}</h3>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base font-bold">₹{product.price}</p>
                  <button
                    onClick={() => addProduct(product)}
                    className="w-full px-2 sm:px-3 py-1 mt-1 sm:mt-2 text-xs sm:text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                  >
                    Add to Bill
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bill Details - Right Column */}
        <div className="lg:w-1/3 h-full flex flex-col">
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow flex-grow flex flex-col">
            <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold">Bill Details</h2>

            <div className="mb-3 sm:mb-4">
              <label className="block mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="block mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter mobile number"
              />
            </div>

            <div className="mb-3 sm:mb-4 flex-grow overflow-y-auto max-h-[30vh]">
              <h3 className="mb-1 sm:mb-2 text-sm sm:text-base font-medium">Selected Products</h3>
              {selectedProducts.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500">No products selected</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedProducts.map(product => (
                    <div key={product.productId} className="p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm sm:text-base font-medium">{product.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">₹{product.price} per unit</p>
                        </div>
                        <button
                          onClick={() => removeProduct(product.productId)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center mt-1 sm:mt-2">
                        <label className="mr-1 sm:mr-2 text-xs sm:text-sm text-gray-700">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={quantityInputs[product.productId] || product.quantity}
                          onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                          className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="mt-1 sm:mt-2 text-right">
                        <span className="text-sm sm:text-base font-medium">Total: ₹{(product.price * product.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-3 sm:pt-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-medium">Total:</span>
                  <span className="text-sm sm:text-base font-bold">₹{totalAmount.toFixed(2)}</span>
                </div>
                <button
                  onClick={generateBill}
                  disabled={selectedProducts.length === 0 || !customerName}
                  className={`w-full px-3 sm:px-4 py-1 sm:py-2 mt-2 sm:mt-3 text-xs sm:text-sm text-white rounded transition-colors ${selectedProducts.length === 0 || !customerName
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  Generate Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillHistory({ user }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/bills`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBills(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const downloadBill = async (billId) => {
    try {
      const response = await fetch(`${baseUrl}/api/bills/${billId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download bill');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download bill. Please try again.');
    }
  };

  const deleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete bill');
      }

      // Refresh the bills list
      await fetchBills();
      alert('Bill deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete bill. Please try again.');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/bills/export/excel`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export to Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bills_export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Calculate total amount
  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Bill History</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            Export to Excel
          </button>
          <Link to="/create-bill" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">
            Create New Bill
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-lg shadow">
          {bills.length === 0 ? (
            <p>No bills generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Bill ID</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map(bill => (
                    <tr key={bill._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill._id.substring(18, 24)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bill.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{bill.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => downloadBill(bill._id)}
                          className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => deleteBill(bill._id)}
                          className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900" colSpan="3">
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
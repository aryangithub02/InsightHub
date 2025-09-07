import { useState, useEffect } from 'react';
import ItemForm from "./components/ItemForm";
import './App.css'
import toast, { Toaster } from 'react-hot-toast';
import { InfinitySpin } from 'react-loader-spinner';
import { fetchBlogs, createBlog, updateBlog, deleteBlog } from './services/firestoreService';
import { onAuthChange, register, login, logout, signInWithGoogle } from './services/authService';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchItem, setSearchItem] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // or 'register'
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);

  const blogsPerPage = 6;

  // Fetch blogs on component mount
  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const apiBlogs = await fetchBlogs();
        console.log('Fetched blogs:', apiBlogs); // Debug log
        
        // Validate that each blog has a proper ID
        const validBlogs = (apiBlogs || []).filter(blog => {
          const isValid = blog && blog.id && typeof blog.id === 'string';
          if (!isValid) {
            console.warn('Invalid blog found:', blog);
          }
          return isValid;
        });
        
        console.log('Valid blogs after filtering:', validBlogs.length);
        setItems(validBlogs);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blogs');
        setItems([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);

  // Filter and sort items with proper null checks
  const filteredItems = items
    .filter(item => item.userId === user?.uid)
    .filter(item => item.title.toLowerCase().includes(searchItem.toLowerCase()))
    .sort((a, b) => {
      if (a.isUserCreated && !b.isUserCreated) return -1;
      if (!a.isUserCreated && b.isUserCreated) return 1;
      return 0;
    });

  // Pagination calculations
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredItems.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredItems.length / blogsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchItem]);

  const handleAdd = async (item) => {
    if (!user) {
      toast.error('You must be logged in to add a blog');
      return;
    }
    if (!item || !item.title || !item.content || !item.author) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newBlog = await createBlog({ 
        ...item, 
        isUserCreated: true,
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      setItems(prev => [newBlog, ...prev]);
      toast.success("Blog Added!");
    } catch (error) {
      toast.error("Failed to add blog");
      console.error('Error adding blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    if (!item || !item.id) {
      toast.error('Invalid blog item');
      return;
    }
    setEditId(item.id);
    setEditTitle(item.title || '');
    setEditContent(item.content || '');
    setEditAuthor(item.author || '');
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editAuthor.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        title: editTitle.trim(),
        content: editContent.trim(),
        author: editAuthor.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateBlog(editId, updatedData);
      
      setItems(items =>
        items.map(item =>
          item.id === editId
            ? { ...item, ...updatedData }
            : item
        )
      );
      
    toast.success("Blog Updated!");
      cancelEdit();
    } catch (error) {
      toast.error("Failed to update blog");
      console.error('Error updating blog:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    // Enhanced ID validation and debugging
    console.log('handleDelete called with ID:', id, 'Type:', typeof id);
    
    if (!id || typeof id !== 'string') {
      console.error('Invalid ID provided to handleDelete:', id);
      toast.error('Invalid blog ID');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to delete blog with ID:', id);
      await deleteBlog(id);
      setItems(items => items.filter(item => item.id !== id));
      toast.success("Blog Deleted!");
      
      // If we're editing the deleted item, cancel edit
      if (editId === id) {
        cancelEdit();
      }
      
      // If we're on the last item of the current page, go to previous page
      if (currentBlogs.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      toast.error("Failed to delete blog");
      console.error('Error deleting blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditContent("");
    setEditAuthor("");
  };

  const handleReadMore = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Fetch blogs from old API
  const fetchOldApiBlogs = async () => {
    try {
      const response = await fetch('https://685aeac089952852c2d80ac4.mockapi.io/blogcrud/api/blogs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching old API blogs:', error);
      throw error;
    }
  };

  // Migrate blogs to Firestore
  const migrateBlogsToFirestore = async () => {
    if (!user) {
      toast.error('You must be logged in to migrate blogs');
      return;
    }
    setMigrationLoading(true);
    try {
      const blogs = await fetchOldApiBlogs();
      if (blogs.length === 0) {
        toast.info('No blogs found to migrate');
        return;
      }
      let successCount = 0;
      let errorCount = 0;
      for (const blog of blogs) {
        try {
          const { id, ...blogData } = blog;
          await createBlog({
            ...blogData,
            isUserCreated: false,
            migratedAt: new Date().toISOString(),
            userId: user.uid
          });
          successCount++;
        } catch (error) {
          console.error('Error migrating blog:', blog, error);
          errorCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully migrated ${successCount} blogs!`);
        const updatedBlogs = await fetchBlogs();
        setItems(updatedBlogs || []);
      }
      if (errorCount > 0) {
        toast.error(`Failed to migrate ${errorCount} blogs`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed. Please try again.');
    } finally {
      setMigrationLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRegister = async () => {
    try {
      await register(email, password);
      toast.success('Registered and logged in!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await login(email, password);
      toast.success('Logged in!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out!');
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      setShowAuthForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-start py-8 px-2 sm:px-8">
      <Toaster />
      
      {/* Top bar with Login/Register or Logout button */}
      <div className="w-full flex justify-end items-center mb-4 px-4">
        {!user ? (
          <button
            onClick={() => {
              setShowAuthForm(true);
              setTimeout(() => {
                const form = document.getElementById('auth-form');
                if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors duration-200"
          >
            Login / Register
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors duration-200"
          >
            Logout
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center w-full h-60">
          <InfinitySpin width="200" color="#6366F1" />
          <span className="mt-6 text-lg text-blue-700 font-semibold animate-pulse">
            Loading blogs...
          </span>
        </div>
      )}

      <div className="w-full flex flex-col items-center" style={{ display: loading ? 'none' : 'flex' }}>
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-8 w-full">
          Blog CRUD App
        </h1>
        
        <div className="w-full max-w-3xl mb-4">
          {user ? (
            <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-3xl">
              <div className="flex items-center gap-4 bg-white rounded-xl shadow p-4 border border-gray-200 w-full justify-between">
                <span className="text-blue-700 font-semibold">Welcome, {user.email}</span>
              </div>
              <button
                onClick={() => setShowBlogForm((prev) => !prev)}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg transition-colors duration-200 py-3 px-6"
              >
                {showBlogForm ? 'Cancel' : 'Create Blog'}
              </button>
              {showBlogForm && (
                <div className="w-full">
                  <ItemForm onAdd={(item) => { handleAdd(item); setShowBlogForm(false); }} />
                </div>
              )}
              <button
                onClick={migrateBlogsToFirestore}
                disabled={migrationLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold shadow-lg transition-colors duration-200 py-3 px-6"
              >
                {migrationLoading ? 'Migrating...' : 'Migrate API Blogs'}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-yellow-300 rounded-lg p-6 text-center text-yellow-700 font-semibold shadow mb-4">
              Please <button
                className="text-blue-600 hover:underline font-bold"
                onClick={() => {
                  setShowAuthForm(true);
                  setTimeout(() => {
                    const form = document.getElementById('auth-form');
                    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              >log in</button> to create a blog.
            </div>
          )}
        </div>
        
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchItem}
          onChange={e => setSearchItem(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 mb-4 w-full max-w-3xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        
        {!user && showAuthForm && (
          <div id="auth-form" className="flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8 mb-8 w-full max-w-sm border border-gray-200 relative">
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Close auth form"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">{authMode === 'login' ? 'Login' : 'Register'}</h2>
            <div className="w-full mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Email</label>
              <input
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete="username"
              />
            </div>
            <div className="w-full mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
              <input
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg shadow mb-4 transition-colors duration-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
            {authMode === 'login' ? (
              <>
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow mb-3 transition-colors duration-200"
                >
                  Login
                </button>
                <p className="text-sm text-gray-600 text-center">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Register
                  </button>
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleRegister}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow mb-3 transition-colors duration-200"
                >
                  Register
                </button>
                <p className="text-sm text-gray-600 text-center">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Login
                  </button>
                </p>
              </>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-4 mb-8 bg-white rounded-xl shadow p-4 border border-gray-200">
            <span className="text-blue-700 font-semibold">Welcome, {user.email}</span>
          </div>
        )}

        {/* Results summary */}
        <div className="w-full max-w-5xl mb-4">
          <p className="text-gray-600 text-center">
            {filteredItems.length === 0 ? 
              'No blogs found' : 
              `Showing ${filteredItems.length} blog${filteredItems.length !== 1 ? 's' : ''}`
            }
            {searchItem && ` for "${searchItem}"`}
          </p>
        </div>
 
        <ul className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {filteredItems.length === 0 && !loading && (
            <li className="col-span-full flex flex-col items-center justify-center py-16">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" 
                alt="No blogs" 
                className="w-24 h-24 mb-4 opacity-70" 
              />
              <span className="text-lg text-gray-500">
                {searchItem ? 'No blogs match your search.' : 'No blogs found.'}
              </span>
            </li>
          )}
          
          {currentBlogs.map(item => {
            // Debug log for each item
            console.log('Rendering blog item:', { id: item.id, title: item.title });
            
            return (
            <li key={item.id} className="bg-white rounded-2xl px-7 py-7 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between h-full border border-gray-100 hover:border-blue-300 relative group">
              {editId === item.id ? (
                <div className="flex flex-col gap-3 h-full">
                  <input
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg font-semibold"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <textarea
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-base"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    placeholder="Content"
                    rows={4}
                  />
                  <input
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                    value={editAuthor}
                    onChange={e => setEditAuthor(e.target.value)}
                    placeholder="Author"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200"
                      onClick={handleUpdate}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => { console.log('Avatar blog id:', item.id); })()}
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.author || 'A')}`} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full border border-blue-200 shadow-sm" 
                    />
                    <span className="text-sm text-gray-500">
                      By <span className="font-medium text-blue-700">{item.author || 'Anonymous'}</span>
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                    {item.title || 'Untitled'}
                  </h2>
                  
                  <p className="text-gray-700 flex-1 whitespace-pre-line mb-4 text-base">
                    {expandedId === item.id || (item.content && item.content.length <= 120)
                      ? item.content || 'No content available'
                      : `${(item.content || '').slice(0, 120)}...`}
                  </p>
                  
                  {item.content && item.content.length > 120 && (
                    <button
                      className="text-blue-600 hover:underline mb-2 w-fit font-medium"
                      onClick={() => handleReadMore(item.id)}
                    >
                      {expandedId === item.id ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto pt-2">
                   
                    
                    {/* Show Edit/Delete buttons only for user-created blogs */}
                    {item.isUserCreated && (
                      <div className="flex gap-2">
                        <button
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors duration-200"
                          onClick={() => {
                            console.log('Delete button clicked for item:', item);
                            handleDelete(item.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          )})}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
          <button
              onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold shadow transition-colors duration-200"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg font-semibold shadow transition-colors duration-200 ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
          >
                    {pageNum}
          </button>
                );
              })}
            </div>
            
          <button
              onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold shadow transition-colors duration-200"
          >
            Next
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from "firebase/firestore";

const BLOGS_COLLECTION = "blogs";

// Fetch all blogs from Firestore
export const fetchBlogs = async () => {
  try {
    console.log('Fetching blogs from Firestore...');
    const snapshot = await getDocs(collection(db, BLOGS_COLLECTION));
    
    const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('Total blogs fetched:', blogs.length);
    return blogs;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw new Error(`Failed to fetch blogs: ${error.message}`);
  }
};

// Create a new blog in Firestore
export const createBlog = async (blog) => {
  try {
    console.log('Creating blog:', blog);
    
    // Validate required fields
    if (!blog.title || !blog.content || !blog.author) {
      throw new Error('Title, content, and author are required fields');
    }
    // Remove old id if it exists
    if (blog.id) {
      delete blog.id;
    }   
    const blogData = {
      ...blog,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, BLOGS_COLLECTION), blogData);
    console.log('Blog created with ID:', docRef.id);
    
    return { 
      id: docRef.id, 
      ...blog,
      createdAt: new Date().toISOString(), // For immediate display
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating blog:', error);
    throw new Error(`Failed to create blog: ${error.message}`);
  }
};

// Update an existing blog in Firestore
export const updateBlog = async (id, updatedBlog) => {
  try {
    console.log('Updating blog:', { id, updatedBlog });
    
    // Validate ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid blog ID provided');
    }
    
    // Validate updated data
    if (!updatedBlog || typeof updatedBlog !== 'object') {
      throw new Error('Invalid blog data provided');
    }
    
    const updateData = {
      ...updatedBlog,
      updatedAt: serverTimestamp()
    };
    
    const docRef = doc(db, BLOGS_COLLECTION, id);
    await updateDoc(docRef, updateData);
    
    console.log('Blog updated successfully:', id);
    return true;
  } catch (error) {
    console.error('Error updating blog:', error);
    
    // Check if it's a permission or not-found error
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: You may not have permission to update this blog');
    } else if (error.code === 'not-found') {
      throw new Error('Blog not found: The blog may have been deleted by another user');
    } else {
      throw new Error(`Failed to update blog: ${error.message}`);
    }
  }
};

// Delete a blog from Firestore
export const deleteBlog = async (id) => {
  try {
    console.log('Deleting blog with ID:', id);
    
    // Validate ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid blog ID provided');
    }
    
    const docRef = doc(db, BLOGS_COLLECTION, id);
    await deleteDoc(docRef);
    
    console.log('Blog deleted successfully:', id);
    return true;
  } catch (error) {
    console.error('Error deleting blog:', error);
    
    // Check if it's a permission or not-found error
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: You may not have permission to delete this blog');
    } else if (error.code === 'not-found') {
      throw new Error('Blog not found: The blog may have been deleted by another user');
    } else {
      throw new Error(`Failed to delete blog: ${error.message}`);
    }
  }
};

// Fetch blogs from old API (for migration)
export const fetchOldApiBlogs = async () => {
  try {
    console.log('Fetching blogs from old API...');
    const response = await fetch('https://685aeac089952852c2d80ac4.mockapi.io/blogcrud/api/blogs');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Old API blogs fetched:', data.length);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching old API blogs:', error);
    throw new Error(`Failed to fetch old API blogs: ${error.message}`);
  }
};

// Migrate blogs from old API to Firestore
export const migrateBlogsToFirestore = async () => {
  try {
    console.log('Starting migration process...');
    const blogs = await fetchOldApiBlogs();
    
    if (blogs.length === 0) {
      console.log('No blogs found to migrate'); 
      return { success: 0, errors: 0, message: 'No blogs found to migrate' };
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const blog of blogs) {
      try {
        const { id, ...blogData } = blog; // Remove old id
        await createBlog(blogData); // Firestore generates a unique id
        successCount++;
        console.log(`Successfully migrated blog: ${blog.title}`);
      } catch (error) {
        errorCount++;
        errors.push({ blog: blog.title || 'Unknown', error: error.message });
        console.error(`Failed to migrate blog: ${blog.title}`, error);
      }
    }
    
    console.log(`Migration completed: ${successCount} successful, ${errorCount} errors`);
    
    return {
      success: successCount,
      errors: errorCount,
      errorDetails: errors,
      message: `Migration completed: ${successCount} successful, ${errorCount} errors`
    };
  } catch (error) {
    console.error('Migration process failed:', error);
    throw new Error(`Migration failed: ${error.message}`);
  }
};

// Helper function to check if a blog exists
export const blogExists = async (id) => {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking blog existence:', error);
    return false;
  }
};

// Helper function to get a single blog
export const getBlog = async (id) => {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Blog not found');
    }
  } catch (error) {
    console.error('Error getting blog:', error);
    throw new Error(`Failed to get blog: ${error.message}`);
  }
};
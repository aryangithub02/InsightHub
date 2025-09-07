import { useState } from 'react'
import toast from 'react-hot-toast';
function ItemForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [nextId, setNextId] = useState(1);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) alert("FIll the form");
    const savePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        // You can add logic here to reject() for error simulation
        resolve();
      }, 1000); // 1 second delay
    });
    
    toast.promise(
      savePromise,
      {
        loading: 'Adding...',
        success: <b>Blog Added!</b>,
        error: <b>Could not save.</b>,
      }
    );
    savePromise.then(() => {
      onAdd({ id: nextId, title, content, author });
      setNextId(nextId + 1);
      setTitle("");
      setContent("");
      setAuthor("");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
      <input 
        type="text" 
        onChange={e => setTitle(e.target.value)} 
        value={title}
        placeholder='Title'
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <textarea
        onChange={e => setContent(e.target.value)}
        value={content}
        placeholder='Content'
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        rows={3}
      />
      <input 
        type="text" 
        onChange={e => setAuthor(e.target.value)} 
        value={author}
        placeholder='Author'
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button 
        type='submit'
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors self-end"
      >
        Add Blog
      </button>
    </form>
  )
}

export default ItemForm

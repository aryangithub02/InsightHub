import React from "react";
import ItemForm from "./ItemForm";

export default function MainBlogUI({
  items,
  loading,
  editId,
  editTitle,
  editContent,
  editAuthor,
  expandedId,
  searchItem,
  currentPage,
  totalPages,
  handleAdd,
  startEdit,
  handleUpdate,
  handleDelete,
  cancelEdit,
  handleReadMore,
  currentBlogs,
  handlePageChange,
  migrateBlogsToFirestore,
  migrationLoading,
  user
}) {
  return (
    <>
      <div className="w-full max-w-3xl">
        <ItemForm onAdd={handleAdd} />
      </div>
      <input
        type="text"
        placeholder="Search blogs..."
        value={searchItem}
        onChange={e => {/* You may need to lift this state up or pass a handler */}}
        className="border border-gray-300 rounded px-3 py-2 mb-4 w-full max-w-3xl focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={migrateBlogsToFirestore}
        disabled={migrationLoading}
        className="mb-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold shadow-lg transition-colors duration-200"
      >
        {migrationLoading ? 'Migrating...' : 'Migrate API Blogs to Firestore'}
      </button>
      <ul className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {currentBlogs.map(item => (
          <li key={item.id} className="bg-white rounded-2xl px-7 py-7 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between h-full border border-gray-100 hover:border-blue-300 relative group">
            {editId === item.id ? (
              <div className="flex flex-col gap-3 h-full">
                {/* ...edit form fields... */}
                <button onClick={handleUpdate}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* ...display blog info... */}
                <button onClick={() => startEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
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
          {/* ...page numbers... */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold shadow transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

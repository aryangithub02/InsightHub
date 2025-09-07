import axios  from "axios";

const API_URL = 'https://685aeac089952852c2d80ac4.mockapi.io/blogcrud/api/blogs';

export const fetchBlogs = () => axios.get(API_URL);
export const createBlog = (blog) => axios.post(API_URL, blog);
export const updateBlog = (id, blog) => axios.put(`${API_URL}/${id}`, blog);
export const deleteBlog = (id) => axios.delete(`${API_URL}/${id}`);
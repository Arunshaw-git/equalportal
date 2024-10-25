import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreatePost.css';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [media, setMedia] = useState(null); // State for media file
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(); // Create FormData object
    formData.append('title', title);
    formData.append('desc', desc);
    if (media) formData.append("media", media);// Attach the media file
    
    try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        const response = await fetch('https://equalportal.onrender.com/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // If token is needed
        },
        body: formData, // Send form data with file
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post"); 
      }
      const data = await response.json();
      console.log('Post created:', data);
      navigate('/');
    }catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <>
    
    <div className="homepage-container">
       <nav className="navbar">
         <div className="logo-container"></div>
       </nav>
      <div className='container'>
          <h1 className="header">Create a Post</h1>
          <form onSubmit={handleSubmit} className='form'>
            <input 
            type="text" 
            placeholder="Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            />
            
            <textarea 
              placeholder="Description" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
            />

            <input 
              type="file" 
              onChange={(e)=> setMedia(e.target.files[0])} className='input'
            />
          <button  type="submit" className='button'>Submit Post</button>
        </form>
       </div>
    </div>
    </>
  );
}

export default CreatePost;

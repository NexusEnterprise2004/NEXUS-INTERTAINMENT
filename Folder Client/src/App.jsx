import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Video, Image, LogOut, Heart, MessageCircle, Send, X, Camera, Trash2, Search, ArrowLeft } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 10) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [posts, setPosts] = useState([]); 
  
  // State Navigasi & View (Pro Feature 🧭)
  // viewMode: 'HOME' (Semua Post) atau 'PROFILE' (Post User Tertentu)
  const [viewMode, setViewMode] = useState('HOME'); 
  const [profileUser, setProfileUser] = useState(null); // Data user yang profilnya lagi dilihat

  // State Search 🔍
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // State Posting & Lainnya
  const [newPostContent, setNewPostContent] = useState(""); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null); 
  const fileInputRef = useRef(null); 
  const avatarInputRef = useRef(null); 
  const [activePostId, setActivePostId] = useState(null); 
  const [commentText, setCommentText] = useState(""); 

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setIsLoggedIn(true); }
  }, []);

  // --- FUNGSI PINTAR FETCH POSTS 🧠 ---
  // Bisa ambil semua, atau ambil punya user tertentu
  const fetchPosts = async (targetUserId = null) => {
    try { 
      let url = 'http://localhost:5000/api/posts';
      if (targetUserId) {
        url += `?userId=${targetUserId}`; // Filter API
      }
      const res = await fetch(url); 
      const data = await res.json(); 
      setPosts(data); 
    } 
    catch (error) { console.error("Gagal ambil data:", error); }
  };

  // Saat viewMode berubah, tentukan data apa yang diambil
  useEffect(() => { 
    if (isLoggedIn) {
      if (viewMode === 'HOME') {
        fetchPosts(); // Ambil Semua
      } else if (viewMode === 'PROFILE' && profileUser) {
        fetchPosts(profileUser._id); // Ambil Punya Dia Aja
      }
    }
  }, [isLoggedIn, viewMode, profileUser]);

  // --- LOGIC PENCARIAN (SEARCH) 🔍 ---
  useEffect(() => {
    // Teknik "Debounce": Tunggu user berhenti ngetik 500ms baru cari ke server
    // Supaya server gak meledak kalau user ngetik cepet
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length > 1) {
        try {
          const res = await fetch(`http://localhost:5000/api/auth/search?q=${searchQuery}`);
          const data = await res.json();
          setSearchResults(data);
          setIsSearching(true);
        } catch (err) { console.error(err); }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // --- NAVIGASI KE PROFIL ---
  const goToProfile = (user) => {
    setProfileUser(user);
    setViewMode('PROFILE');
    setSearchQuery(""); // Reset search
    setIsSearching(false);
  };

  const goHome = () => {
    setViewMode('HOME');
    setProfileUser(null);
  };

  // --- ACTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: e.target[0].value, password: e.target[1].value }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("nexus_user", JSON.stringify(data)); setCurrentUser(data); setIsLoggedIn(true); } else alert(data.message);
    } catch (error) { alert("Server error"); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('avatar', file);
    try {
      const res = await fetch('http://localhost:5000/api/auth/avatar', { method: 'PUT', headers: { 'Authorization': `Bearer ${currentUser.token}` }, body: formData });
      const updatedUser = await res.json();
      if (res.ok) { 
        const newData = { ...currentUser, avatar: updatedUser.avatar }; 
        localStorage.setItem("nexus_user", JSON.stringify(newData)); 
        setCurrentUser(newData); 
        alert("Foto Profil Berhasil Diganti!"); 
        // Jika sedang lihat profil sendiri, refresh
        if (viewMode === 'PROFILE' && profileUser._id === currentUser._id) {
           fetchPosts(currentUser._id);
        } else {
           fetchPosts();
        }
      } 
      else alert("Gagal ganti foto");
    } catch (error) { alert("Error upload avatar"); }
  };

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() && !selectedFile) return alert("Isi dulu!");
    try {
      const formData = new FormData(); formData.append('userId', currentUser._id); formData.append('content', newPostContent); if (selectedFile) formData.append('image', selectedFile);
      const res = await fetch('http://localhost:5000/api/posts', { method: 'POST', body: formData });
      if (res.ok) { 
        // Refresh sesuai view sekarang
        if (viewMode === 'HOME') fetchPosts();
        else if (viewMode === 'PROFILE' && profileUser._id === currentUser._id) fetchPosts(currentUser._id);
        
        setNewPostContent(""); setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    } catch (error) { console.error(error); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Yakin mau hapus postingan ini?")) return; 
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser._id })
      });
      if (res.ok) {
         // Hapus dari state UI langsung (Optimistic UI Update) biar kerasa cepet
         setPosts(posts.filter(p => p._id !== postId));
      } else { const err = await res.json(); alert(err.message); }
    } catch (error) { console.error("Gagal hapus:", error); }
  };

  const handleLike = async (postId) => { try { await fetch(`http://localhost:5000/api/posts/${postId}/like`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser._id }) }); 
    // Fetch ulang biar angka update (bisa dioptimalkan lagi nanti)
    if (viewMode === 'HOME') fetchPosts(); else fetchPosts(profileUser._id);
  } catch (error) {} };
  
  const handleCommentSubmit = async (postId) => { if (!commentText.trim()) return; try { const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser._id, text: commentText }) }); if (res.ok) { 
    if (viewMode === 'HOME') fetchPosts(); else fetchPosts(profileUser._id);
    setCommentText(""); } } catch (error) {} };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 text-gray-200">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#161b22] p-10 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">NEXUS</h1>
        <form onSubmit={handleLogin} className="space-y-4 text-left mt-8">
          <input type="text" placeholder="Username" className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-all" required />
          <input type="password" placeholder="Password" className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-all" required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">Sign In</button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans pb-20">
      <nav className="sticky top-0 z-50 bg-[#161b22]/80 backdrop-blur-md border-b border-gray-800 p-4 px-4 lg:px-8">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 onClick={goHome} className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">NEXUS</h1>
          
          {/* SEARCH BAR BARU 🔍 */}
          <div className="hidden md:flex relative w-1/3">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-500"/>
             </div>
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Teman..." 
                className="w-full bg-[#0d1117] border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
             />
             {/* DROPDOWN HASIL SEARCH */}
             {isSearching && searchResults.length > 0 && (
                <div className="absolute top-12 left-0 w-full bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                   {searchResults.map(user => (
                      <div key={user._id} onClick={() => goToProfile(user)} className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors">
                         <div className="w-8 h-8 rounded-full bg-purple-600 overflow-hidden">
                            <img src={user.avatar || "https://via.placeholder.com/150"} alt="av" className="w-full h-full object-cover"/>
                         </div>
                         <span className="font-bold text-sm">{user.username}</span>
                      </div>
                   ))}
                </div>
             )}
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-1.5 rounded-full border border-gray-700">
               <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
               <div className="w-8 h-8 rounded-full bg-blue-600 overflow-hidden cursor-pointer hover:opacity-80 relative group" onClick={() => avatarInputRef.current.click()}>
                  <img src={currentUser?.avatar} alt="profile" className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><Camera size={12} /></div>
               </div>
               {/* KLIK NAMA SENDIRI -> KE PROFIL SENDIRI */}
               <span onClick={() => goToProfile(currentUser)} className="font-bold text-sm hidden md:block cursor-pointer hover:text-blue-400">{currentUser?.username}</span>
            </div>
            <button onClick={() => {localStorage.removeItem("nexus_user"); setIsLoggedIn(false);}} className="text-gray-400 hover:text-red-400"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 lg:p-8 space-y-6">
        
        {/* JIKA MODE PROFILE: TAMPILKAN HEADER PROFIL */}
        {viewMode === 'PROFILE' && profileUser && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161b22] p-8 rounded-3xl border border-gray-800 shadow-xl text-center relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
             
             <button onClick={goHome} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 font-bold text-sm bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <ArrowLeft size={16} /> Kembali ke Home
             </button>

             <div className="relative mt-8">
                <div className="w-32 h-32 rounded-full bg-blue-600 mx-auto border-4 border-[#161b22] shadow-2xl overflow-hidden">
                   <img src={profileUser.avatar || "https://via.placeholder.com/150"} alt="big-profile" className="w-full h-full object-cover"/>
                </div>
                <h2 className="text-3xl font-black text-white mt-4">{profileUser.username}</h2>
                <p className="text-gray-500 font-bold tracking-widest text-xs mt-1 uppercase">Nexus Member</p>
                <div className="mt-6 flex justify-center gap-8 text-gray-400">
                   <div className="text-center"><span className="block text-2xl font-bold text-white">{posts.length}</span><span className="text-xs">Posts</span></div>
                   <div className="text-center"><span className="block text-2xl font-bold text-white">0</span><span className="text-xs">Followers</span></div>
                </div>
             </div>
          </motion.div>
        )}

        {/* INPUT POST (Hanya muncul di Home atau Profil Sendiri) */}
        {(viewMode === 'HOME' || (viewMode === 'PROFILE' && profileUser._id === currentUser._id)) && (
          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={`Apa kabar, ${currentUser?.username}?`} className="w-full bg-transparent border-none outline-none text-lg resize-none mb-4 text-white placeholder-gray-600" rows="2"></textarea>
            {previewUrl && (<div className="relative mb-4"><img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-xl border border-gray-700" /><button onClick={() => {setSelectedFile(null); setPreviewUrl(null);}} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-red-500 transition-colors"><X size={20} className="text-white" /></button></div>)}
            <div className="flex justify-between items-center border-t border-gray-800 pt-4">
              <div className="flex gap-4 text-gray-400">
                <input type="file" ref={fileInputRef} onChange={(e) => {const f=e.target.files[0]; if(f){setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f));}}} className="hidden" accept="image/*" />
                <Image size={20} className="hover:text-green-400 cursor-pointer" onClick={() => fileInputRef.current.click()} /><Video size={20} className="hover:text-blue-400 cursor-pointer"/>
              </div>
              <button onClick={handlePostSubmit} className="bg-blue-600 px-6 py-2 rounded-full font-bold text-white hover:bg-blue-500">Post</button>
            </div>
          </div>
        )}

        {/* POST LIST */}
        <div className="space-y-6">
          {posts.length === 0 && (
             <div className="text-center py-20 text-gray-600">
                <p>Belum ada postingan disini 🦗</p>
             </div>
          )}
          
          <AnimatePresence>
            {posts.map(post => {
              const isLiked = post.likes.includes(currentUser._id);
              const isCommentOpen = activePostId === post._id;
              const isMyPost = post.user?._id === currentUser._id;

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={post._id} className="bg-[#161b22] rounded-2xl border border-gray-800 shadow-sm overflow-hidden relative group">
                  {isMyPost && (<button onClick={() => handleDeletePost(post._id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0d1117] p-2 rounded-full shadow-lg"><Trash2 size={18} /></button>)}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {/* KLIK AVATAR -> KE PROFIL ORANG ITU */}
                      <div onClick={() => goToProfile(post.user)} className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white text-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors">
                        <img src={post.user?.avatar || "https://via.placeholder.com/150"} alt="user" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 onClick={() => goToProfile(post.user)} className="font-bold text-white text-sm cursor-pointer hover:text-blue-400 hover:underline">{post.user?.username}</h4>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">{post.content}</p>
                    {post.image && (<div className="mb-4 rounded-xl overflow-hidden border border-gray-800"><img src={post.image} alt="Post content" className="w-full object-cover max-h-96" /></div>)}
                    <div className="flex gap-6 text-gray-400 text-sm border-t border-gray-800/50 pt-4">
                      <button onClick={() => handleLike(post._id)} className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}><Heart size={18} fill={isLiked ? "currentColor" : "none"} /> {post.likes?.length || 0}</button>
                      <button onClick={() => setActivePostId(isCommentOpen ? null : post._id)} className={`flex items-center gap-2 ${isCommentOpen ? 'text-blue-400' : 'hover:text-blue-400'}`}><MessageCircle size={18}/> {post.comments?.length || 0}</button>
                    </div>
                  </div>
                  {isCommentOpen && (
                    <div className="bg-[#0d1117] p-4 border-t border-gray-800">
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">{post.comments?.map((comment, idx) => (<div key={idx} className="flex gap-2 items-start"><span className="font-bold text-xs text-blue-400 mt-1">{comment.user?.username}:</span><p className="text-sm text-gray-300 bg-[#161b22] px-3 py-1 rounded-lg rounded-tl-none">{comment.text}</p></div>))}</div>
                      <div className="flex gap-2"><input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Tulis komentar..." className="flex-1 bg-[#161b22] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"/><button onClick={() => handleCommentSubmit(post._id)} className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-500"><Send size={16} /></button></div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
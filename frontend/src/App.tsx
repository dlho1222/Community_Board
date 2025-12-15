import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import BoardListPage from './pages/BoardListPage';
import BoardDetailPage from './pages/BoardDetailPage';
import BoardWritePage from './pages/BoardWritePage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminPostManagementPage from './pages/AdminPostManagementPage';

import './App.css'; // Keep existing CSS
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

function App() {
  return (
    <Router>
      <Header />
      <main style={{ minHeight: '80vh' }}> {/* Added for content area */}
        <Routes>
          <Route path="/" element={<BoardListPage />} /> {/* Home page as Board List */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/board/edit/:id" element={<BoardWritePage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/posts" element={<AdminPostManagementPage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;

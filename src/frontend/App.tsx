import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, Admin, Contact, Waiting, Response } from './pages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 首页/车主注册 */}
        <Route path="/" element={<Home />} />

        {/* 车主管理后台 */}
        <Route path="/admin/:id" element={<Admin />} />

        {/* 挪车请求页面（扫码进入） */}
        <Route path="/c/:id" element={<Contact />} />

        {/* 请求者等待页面 */}
        <Route path="/w/:id" element={<Waiting />} />

        {/* 车主确认页面 */}
        <Route path="/r/:id" element={<Response />} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen bg-ios-bg flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
              <p className="text-ios-gray-1">页面不存在</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

import React from 'react';
import Header from '../components/layout/Header';
import Users from '../components/Users';
import Footer from '../components/layout/Footer';

function UsersPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Header />
      <Users />
      <Footer />
    </div>
  );
}

export default UsersPage;

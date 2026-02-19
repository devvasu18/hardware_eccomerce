'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FiUser, FiShoppingBag, FiSettings, FiLock, FiChevronRight } from 'react-icons/fi';
import { MdOutlineDashboard } from 'react-icons/md';
import { motion } from 'framer-motion';

import './account.css';

export default function AccountPage() {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) {
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0
        }
    };

    return (
        <main className="account-page">
            <Header />

            <div className="account-container">

                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="account-header-section"
                >
                    <h1 className="account-title" suppressHydrationWarning>My Account</h1>
                    <p className="account-subtitle">Manage your personal dashboard</p>
                </motion.div>

                <div className="account-layout">

                    {/* Left Column: Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="profile-column"
                    >
                        <div className="profile-card">
                            {/* Card Header */}
                            <div className="profile-cover">
                                <div className="profile-cover-decoration"></div>
                            </div>

                            {/* Avatar */}
                            <div className="profile-avatar-wrapper">
                                <div className="profile-avatar">
                                    <span>
                                        {user.username?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="profile-info">
                                <h2 className="profile-name" suppressHydrationWarning>{user.username}</h2>
                                <p className="profile-email">{user.email}</p>

                                <div className="role-badge">
                                    <span className="role-dot"></span>
                                    {user.role}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Action Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="dashboard-column"
                    >
                        <div className="dashboard-grid">

                            {/* Admin Dashboard */}
                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                <motion.div variants={itemVariants} className="admin-card-wrapper">
                                    <Link href="/admin" className="dashboard-link">
                                        <div className="dashboard-card admin-card">
                                            <div className="admin-card-decoration"></div>
                                            <div className="dashboard-card-header">
                                                <div className="dashboard-icon">
                                                    <MdOutlineDashboard size={32} />
                                                </div>
                                                <FiChevronRight size={24} className="card-arrow" />
                                            </div>
                                            <div className="dashboard-content-flex">
                                                <h3 className="dashboard-card-title">{t('admin_dashboard')}</h3>
                                                <p className="dashboard-card-desc">Access system overview</p>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}

                            {/* My Profile */}
                            <motion.div variants={itemVariants}>
                                <Link href="/profile" className="dashboard-link">
                                    <div className="dashboard-card">
                                        <div className="dashboard-card-header">
                                            <div className="dashboard-icon">
                                                <FiUser size={24} />
                                            </div>
                                            <FiChevronRight className="card-arrow" />
                                        </div>
                                        <div className="dashboard-content-flex">
                                            <h3 className="dashboard-card-title">{t('my_profile')}</h3>
                                            <p className="dashboard-card-desc">Personal details & preferences</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* My Orders */}
                            <motion.div variants={itemVariants}>
                                <Link href="/orders" className="dashboard-link">
                                    <div className="dashboard-card">
                                        <div className="dashboard-card-header">
                                            <div className="dashboard-icon">
                                                <FiShoppingBag size={24} />
                                            </div>
                                            <FiChevronRight className="card-arrow" />
                                        </div>
                                        <div className="dashboard-content-flex">
                                            <h3 className="dashboard-card-title">{t('my_orders')}</h3>
                                            <p className="dashboard-card-desc">Track shipments & history</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Change Password */}
                            <motion.div variants={itemVariants}>
                                <Link href="/change-password" className="dashboard-link">
                                    <div className="dashboard-card">
                                        <div className="dashboard-card-header">
                                            <div className="dashboard-icon">
                                                <FiLock size={24} />
                                            </div>
                                            <FiChevronRight className="card-arrow" />
                                        </div>
                                        <div className="dashboard-content-flex">
                                            <h3 className="dashboard-card-title">{t('change_password')}</h3>
                                            <p className="dashboard-card-desc">Update login credentials</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Settings */}
                            <motion.div variants={itemVariants}>
                                <Link href="/settings" className="dashboard-link">
                                    <div className="dashboard-card">
                                        <div className="dashboard-card-header">
                                            <div className="dashboard-icon">
                                                <FiSettings size={24} />
                                            </div>
                                            <FiChevronRight className="card-arrow" />
                                        </div>
                                        <div className="dashboard-content-flex">
                                            <h3 className="dashboard-card-title">{t('settings')}</h3>
                                            <p className="dashboard-card-desc">App settings & logout</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

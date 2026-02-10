'use client';

import React, { useState, useEffect } from 'react';
import { getSystemSettings } from '../utils/systemSettings';

const Footer = () => {
    const [companyName, setCompanyName] = useState('Hardware Store');

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSystemSettings();
            if (settings && settings.companyName) {
                setCompanyName(settings.companyName);
            }
        };
        fetchSettings();
    }, []);

    const year = new Date().getFullYear();

    return (
        <footer>
            <div className="container" style={{ textAlign: 'center', opacity: 0.8 }}>
                <p>&copy; {year} {companyName}. All rights reserved.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>Tally Connected | Local Bus Logistics Integrated</p>
            </div>
        </footer>
    );
};

export default Footer;

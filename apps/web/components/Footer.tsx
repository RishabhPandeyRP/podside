'use client';

import Link from 'next/link';
// import Image from 'next/image';
import {
    FaTwitter,
    FaLinkedin,
    FaGithub,
    FaFacebook,
    FaInstagram
} from 'react-icons/fa';

export default function Footer() {
    const navLinks = [
        { name: 'Products', href: '/products' },
        { name: 'Studio', href: '/studio' },
        { name: 'Clients', href: '/clients' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Blog', href: '/blog' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
    ];

    const socialLinks = [
        { name: 'Twitter', icon: FaTwitter, href: 'https://twitter.com' },
        { name: 'LinkedIn', icon: FaLinkedin, href: 'https://linkedin.com' },
        { name: 'GitHub', icon: FaGithub, href: 'https://github.com' },
        { name: 'Facebook', icon: FaFacebook, href: 'https://facebook.com' },
        { name: 'Instagram', icon: FaInstagram, href: 'https://instagram.com' },
    ];

    return (
        <footer className="bg-[#060606] text-neutral-400 w-full  ">
            <div className="container mx-auto px-4 py-8">
                {/* Logo and Navigation */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        {/* <div className="bg-white rounded-lg p-2 mr-2">
                            <span className="text-black font-bold text-xl">A</span>
                        </div> */}
                        <span className="font-bold text-xl">Startup</span>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-4 md:gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-neutral-400 hover:text-white transition-colors duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Divider */}
                <div className="relative h-6 w-full my-8">
                    
                    <div className="absolute left-0 top-0 h-full w-32 z-20 bg-gradient-to-r from-[#060606] to-transparent pointer-events-none" />

                    
                    <div className="absolute right-0 top-0 h-full w-32 z-20 bg-gradient-to-l from-[#060606] to-transparent pointer-events-none" />

                    
                    <div
                        className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-600 z-10 transform -translate-y-1/2"
                        style={{
                            borderWidth: "1px",
                            borderTopStyle: "dashed",
                        }}
                    />
                </div>




                {/* Copyright and Social Links */}
                <div className="flex flex-col md:flex-row justify-between items-center px-10">
                    <div className="text-neutral-400 text-sm mb-4 md:mb-0">
                        © DevStudios LLABC
                    </div>

                    <div className="flex space-x-6">
                        {socialLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                aria-label={link.name}
                                className="text-neutral-400 hover:text-white transition-colors duration-200"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <link.icon size={20} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
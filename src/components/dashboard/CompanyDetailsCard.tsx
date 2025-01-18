'use client';

import React from 'react'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { Stethoscope } from 'lucide-react'

const CompanyDetailsCard = () => {
  return (
    <Card className="overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-900">
        <CardContent className='p-0'>
            {/* Main Platform Info Section */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 p-12 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.03),transparent)] opacity-100"></div>
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/50 to-transparent"></div>
                
                <div className="relative max-w-2xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                        <Stethoscope className="w-10 h-10 mr-4 text-gray-600" />
                        <h2 className="text-3xl font-bold text-center tracking-tight text-gray-800">Axonify</h2>
                    </div>
                    <p className="text-base text-center text-gray-600 max-w-[600px] mx-auto leading-relaxed">
                        Bridging the gap between healthcare providers and patients through innovative digital solutions, ensuring better healthcare access and outcomes for all.
                    </p>
                </div>
            </div>

            {/* Company Info Section */}
            <div className="p-12 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900">
                <div className="flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto">
                    {/* Powered By Text */}
                    <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-6 py-2 rounded-full shadow-sm">
                        <p className="text-[11px] font-semibold tracking-[0.3em] text-gray-600 dark:text-gray-400">
                            POWERED BY
                        </p>
                    </div>

                    {/* Logo and Company Name */}
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                            <Image
                                src="/logo.png"
                                alt="AxonCare Logo"
                                width={63}
                                height={50}
                                className="relative w-29 h-18"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className='text-2xl font-bold tracking-wide text-gray-900 dark:text-gray-100'>
                                AxonCare
                            </h3>
                            <p className="text-xs tracking-[0.3em] text-gray-600 dark:text-gray-400 font-medium mt-2">
                                Health • Care • Live
                            </p>
                        </div>
                    </div>

                    {/* Company Description */}
                    <div className="text-center max-w-xl">
                        <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed">
                            AxonCare, a service brand by Axonic, is a global healthcare network that connects doctors and patients worldwide through cutting-edge technology solutions.
                        </p>
                        <a 
                            href="https://axoncare.io/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-8 inline-flex items-center px-8 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-gray-100 via-white to-gray-100 hover:from-gray-200 hover:via-gray-100 hover:to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:hover:from-gray-700 dark:hover:via-gray-800 dark:hover:to-gray-700 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-all duration-300 shadow-sm hover:shadow group"
                        >
                            Visit AxonCare
                            <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  )
}

export default CompanyDetailsCard 
import React, { useState } from 'react';
import { Users, TrendingUp, Shield, Clock, DollarSign, Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import LenderDashboard from './components/dashboard/LenderDashboard';
import BorrowerDashboard from './components/dashboard/BorrowerDashboard';
import LoanCard from './components/loans/LoanCard';
import WalletButton from './components/WalletButton';
import { useWallet } from './hooks/useWallet';
import { mockLoans } from './data/mockData';

type UserType = 'lender' | 'borrower' | null;

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  lendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS || '0x6b93F6F4e601dd1d5C99b5Db4F5fc10E0068A0Be',
  reputationOracle: import.meta.env.VITE_REPUTATION_ORACLE_ADDRESS || '0xeae7d0Eb4f103230f2d370A8aeE657bd91Abf330',
  usdc: import.meta.env.VITE_USDC_ADDRESS || '0x3Eb8145DCCD22489Bb64E425De53406C2aE29a72'
};

const BASESCAN_URL = 'https://sepolia.basescan.org/address';

function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">
                  Global MicroLend
                </h1>
                <span className="ml-2 text-sm text-gray-500">By MetaInside</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setUserType('lender')}
                className={`text-sm font-medium ${
                  userType === 'lender' ? 'text-emerald-600' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Lender Portal
              </button>
              <button
                onClick={() => setUserType('borrower')}
                className={`text-sm font-medium ${
                  userType === 'borrower' ? 'text-emerald-600' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Borrower Portal
              </button>
              <div className="relative">
                <WalletButton />
              </div>
            </nav>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  setUserType('lender');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Lender Portal
              </button>
              <button
                onClick={() => {
                  setUserType('borrower');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Borrower Portal
              </button>
              <div className="px-3 py-2">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {userType === 'lender' && <LenderDashboard />}
        {userType === 'borrower' && <BorrowerDashboard />}
        
        {!userType && (
          <div className="relative">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-sky-50 py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                    Empowering Global Financial Inclusion
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Connect with borrowers worldwide and make a difference while earning fair returns through decentralized microloans.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setUserType('lender')}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Start Lending
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setUserType('borrower')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Apply for a Loan
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-gray-900">Why Choose Global MicroLend?</h3>
                  <p className="mt-4 text-lg text-gray-600">Built on blockchain for transparency, security, and global accessibility</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <Shield className="h-8 w-8 text-emerald-600" />
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Secure & Transparent</h4>
                    <p className="text-gray-600">All transactions are recorded on-chain with multi-sig escrow protection</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-sky-100 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-sky-600" />
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Fair Returns</h4>
                    <p className="text-gray-600">Earn competitive yields while supporting global financial inclusion</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Users className="h-8 w-8 text-amber-600" />
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Reputation-Based</h4>
                    <p className="text-gray-600">On-chain credit scoring ensures reliable borrowers and builds trust</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Active Loans */}
            <div className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-gray-900">Active Loans</h3>
                  <p className="mt-4 text-lg text-gray-600">Real borrowers making real impact</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockLoans.slice(0, 3).map((loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-emerald-600 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white">$2.5M</div>
                    <div className="text-emerald-100">Total Value Locked</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">1,234</div>
                    <div className="text-emerald-100">Active Loans</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">98.5%</div>
                    <div className="text-emerald-100">Repayment Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">12.5%</div>
                    <div className="text-emerald-100">Average APY</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-lg text-gray-600 mb-8">Join thousands of users creating financial opportunities worldwide</p>
                <div className="relative inline-block">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Contract Addresses Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-2">Contract Addresses (Base Sepolia)</h4>
              <div className="space-y-1 text-sm font-mono">
                <p className="flex items-center">
                  Lending Pool: 
                  <a 
                    href={`${BASESCAN_URL}/${CONTRACT_ADDRESSES.lendingPool}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 ml-2 inline-flex items-center"
                  >
                    {CONTRACT_ADDRESSES.lendingPool.slice(0, 6)}...{CONTRACT_ADDRESSES.lendingPool.slice(-4)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
                <p className="flex items-center">
                  Reputation Oracle: 
                  <a 
                    href={`${BASESCAN_URL}/${CONTRACT_ADDRESSES.reputationOracle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 ml-2 inline-flex items-center"
                  >
                    {CONTRACT_ADDRESSES.reputationOracle.slice(0, 6)}...{CONTRACT_ADDRESSES.reputationOracle.slice(-4)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
                <p className="flex items-center">
                  USDC: 
                  <a 
                    href={`${BASESCAN_URL}/${CONTRACT_ADDRESSES.usdc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 ml-2 inline-flex items-center"
                  >
                    {CONTRACT_ADDRESSES.usdc.slice(0, 6)}...{CONTRACT_ADDRESSES.usdc.slice(-4)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">© 2024 Global MicroLend By MetaInside</p>
              <p className="text-sm mt-1">Empowering financial inclusion through DeFi</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

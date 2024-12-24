import { Phone, Shield, Building2, Users, Star, Loader2, Hammer, Menu, X } from 'lucide-react'
import logo from './assets/logo.svg'
import { useEffect, useState } from 'react'

export default function Business() {
    const [stars, setStars] = useState(0)
    const [loading, setLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        fetch('https://api.github.com/repos/Surfer-Org/Protocol')
            .then(res => res.json())
            .then(data => {
                setStars(data.stargazers_count)
                setLoading(false)
            })
            .catch(err => {
                console.error('Error fetching stars:', err)
                setLoading(false)
            })
    }, [])


  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      {/* Navbar */}
          <nav className="bg-[#1b1b1b] shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16 items-center">
                      <div className="flex items-center">
                          <img src={logo} alt="Surfer Protocol" className="h-8 w-auto" />
                      </div>

                      {/* Desktop Menu */}
                      <div className="hidden md:flex items-center space-x-6">
                          <a href="/" className="text-gray-200 hover:text-gray-300">
                              For Developers
                          </a>
                          <a href="https://github.com/Surfer-Org/Protocol"
                              target="_blank"
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] hover:bg-[#2a2a2a] rounded-md text-gray-200 transition-colors min-w-[80px] justify-center">
                              {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                  <>
                                      <Star className="w-4 h-4 fill-current" />
                                      <span>{stars}</span>
                                  </>
                              )}
                          </a>
                          <a target="_blank"
                              href="https://cal.com/sahil-lalani/30min"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                              <Phone className="w-5 h-5 mr-2" />
                              Schedule a Call
                          </a>
                      </div>

                      {/* Mobile menu button */}
                      <div className="md:hidden">
                          <button
                              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                          >
                              {mobileMenuOpen ? (
                                  <X className="block h-6 w-6" />
                              ) : (
                                  <Menu className="block h-6 w-6" />
                              )}
                          </button>
                      </div>
                  </div>
              </div>

              {/* Mobile menu */}
              {mobileMenuOpen && (
                  <div className="md:hidden">
                      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                          <a
                              href="/"
                              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700"
                          >
                              For Developers
                          </a>
                          <hr />
                          <a
                              href="https://github.com/Surfer-Org/Protocol"
                              target="_blank"
                              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700"
                          >
                              {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                  <>
                                      <Star className="w-4 h-4 fill-current" />
                                      <span>{stars}</span>
                                  </>
                              )}
                          </a>
                          <hr />
                          <a
                              href="https://github.com/Surfer-Org/Protocol"
                              target="_blank"
                              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700"
                          >
                              <Hammer className="w-5 h-5 mr-2" />
                              Start Building
                          </a>
                      </div>
                  </div>
              )}
          </nav>
      <hr />  
      {/* Hero Section */}
      <div className="relative bg-[#1b1b1b] pt-12 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl tracking-tight font-extrabold text-[#E5FCFF] sm:text-5xl md:text-6xl">
              <span className="block text-blue-600">Enterprise Solutions for</span>
              <span className="block">Data Management</span>
            </h1>
            <p className="max-w-md mx-auto text-base text-gray-400 sm:text-lg md:text-xl md:max-w-3xl">
              Empower your organization with secure, compliant, and efficient data management solutions built on Surfer Protocol.
            </p>
            <div className="flex justify-center">
              <a target="_blank" href="https://cal.com/sahil-lalani/30min"
                className="inline-flex items-center px-6 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <Phone className="w-5 h-5 mr-2" />
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </div>
      <hr />
      {/* Features Grid */}
      <div className="bg-[#1b1b1b] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-[#252525] rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Enterprise Security</h3>
              <p className="text-gray-400">
                Enhanced security features, access controls, and compliance tools designed for enterprise needs.
              </p>
            </div>

            <div className="p-6 bg-[#252525] rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Custom Integration</h3>
              <p className="text-gray-400">
                Tailored solutions to integrate Surfer Protocol with your existing infrastructure and workflows.
              </p>
            </div>

            <div className="p-6 bg-[#252525] rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Dedicated Support</h3>
              <p className="text-gray-400">
                Priority support with dedicated technical account managers and implementation assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to transform your data management?</span>
            <span className="block text-blue-200">Let's discuss your needs.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="https://cal.com/sahil-lalani/30min"
                target="_blank"
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                <Phone className="w-5 h-5 mr-2" />
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1b1b1b]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="https://github.com/Surfer-Org/Protocol" target="_blank" className="text-gray-400 hover:text-gray-500">
              GitHub
            </a>
            <a href="https://discord.gg/5KQkWApkYC" target="_blank" className="text-gray-400 hover:text-gray-500">
              Discord
            </a>
            <a href="https://twitter.com/SurferProtocol" target="_blank" className="text-gray-400 hover:text-gray-500">
              Twitter
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Surfer Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
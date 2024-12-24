import { Tweet } from 'react-tweet'
import logo from './assets/logo.svg'
import cover_image from './assets/cover_image.png'
import { Laptop, Hammer, BookOpen, Lock, Github, Phone, Star, Loader2, Download, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function App() {
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
            <div className="hidden md:flex items-center space-x-8">
              <a href="https://sahillalani.substack.com" target="_blank" className="text-gray-200 hover:text-gray-300">
                Blog
              </a>
              <a href="/business" className="text-gray-200 hover:text-gray-300">
                For businesses
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
                href="https://docs.surferprotocol.org/desktop/installation" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Hammer className="w-5 h-5 mr-2" />
                Get started
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
                href="/business"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700"
              >
                For businesses
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
                href="https://docs.surferprotocol.org/desktop/installation"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700"
              >
                <Hammer className="w-5 h-5 mr-2" />
                Get started
              </a>
            </div>
          </div>
        )}
      </nav>
      <hr/>
      {/* Hero Section */}
      <div className="relative bg-[#1b1b1b] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 bg-[#1b1b1b] pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="text-center w-full">
                  <a className="cursor-pointer inline-flex items-center px-3 py-1 mb-4 rounded-full bg-blue-600/10 text-blue-500 text-md" href="https://docs.surferprotocol.org/claude" target="_blank">
                    <span>✨ NEW: Connect Surfer to Claude using Model Context Protocol</span>
                  </a>
                  <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                    <span className="block text-blue-600">Export Your Personal Data</span>
                    <span className="block text-[#E5FCFF]">With Surfer Protocol</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl mx-auto md:mt-5 md:text-xl">
                    Your personal data is siloed across many platforms. Take control back with Surfer Protocol - the open-source framework for exporting your data.
                  </p>
                  <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
                    <div className="rounded-md shadow">
                      <a target="_blank" href="https://docs.surferprotocol.org/desktop/installation" 
                         className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                        <Hammer className="w-5 h-5 mr-2" />
                        Get started
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      <hr/>
      {/* Features Section */}
      <div id="features" className="py-12 bg-[#1b1b1b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#E5FCFF] sm:text-4xl">
              Everything you need to control your data
            </p>
          </div>

          

          <div className="mt-16">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Desktop App */}
              {/* Local First */}
              <div className="relative p-6 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                  <Lock className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Local-First</h3>
                <p className="text-gray-400">
                  Your data stays on your machine. No cloud storage, no external servers - complete privacy and control.
                </p>
              </div>

              {/* Open Source */}
              <div className="relative p-6 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                  <Github className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Open-Source</h3>
                <p className="text-gray-400">
                  Fully transparent, community-driven development. Audit the code, contribute, and build trust.
                </p>
              </div>
              <div className="relative p-6 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                  <Laptop className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Desktop App</h3>
                <p className="text-gray-400">
                  Export your data from popular platforms and services with our easy-to-use desktop application.
                </p>
              </div>



              {/* Python SDK */}
              <div className="relative p-6 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                  <Hammer className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Python SDK</h3>
                <p className="text-gray-400">
                  Build applications using your personal data with our comprehensive Python SDK.
                </p>
              </div>

              {/* Cookbook */}
              <div className="relative p-6 bg-[#252525] rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-600/10">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-[#E5FCFF] mb-2">Cookbook</h3>
                <p className="text-gray-400">
                  A collection of examples and tutorials for building applications with Surfer Protocol.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr/>
      {/* How It Works Section */}
      <div id="how-it-works" className="bg-[#1b1b1b] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#E5FCFF] sm:text-4xl">
              Simple 3-step process
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Steps */}
              {[
                {
                  title: "Export Your Data",
                  description: "Click export and let our app handle the data extraction process"
                },
                {
                  title: "Process & Store",
                  description: "Your data is processed and stored securely on your local machine"
                },
                {
                  title: "Build & Create",
                  description: "Use our SDK to build applications with your exported data"
                }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      {index + 1}
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-[#E5FCFF]">{step.title}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {step.description}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <hr/>
      {/* Updated Testimonials Section */}
      <div id="testimonials" className="py-12 bg-[#1b1b1b] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#E5FCFF] sm:text-4xl">
              What people are saying
            </p>
          </div>
          
          <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_32px,_black_calc(100%-32px),transparent_100%)]">
            <div className="flex animate-infinite-scroll gap-8 items-start">
              {[
                "1824171255211155463",
                "1825952058484339046",
                "1824212974472663440",
                "1824582877268545664",
                "1824404896168210893",
                "1824212957200609515"
              ].map((id) => (
                <div key={id} className="w-[400px] flex-shrink-0">
                  <Tweet id={id} />
                </div>
              ))}
            </div>
            <div className="flex animate-infinite-scroll gap-8 items-start" aria-hidden="true">
              {[
                "1824171255211155463",
                "1825952058484339046",
                "1824212974472663440",
                "1824582877268545664",
                "1824404896168210893",
                "1824212957200609515"
              ].map((id) => (
                <div key={id} className="w-[400px] flex-shrink-0">
                  <Tweet id={id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <hr/>
      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to Get started?</span>
            <span className="block text-blue-200">Get started with Surfer Protocol today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a target="_blank" href="https://docs.surferprotocol.org/desktop/installation" 
                 className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                <Hammer className="w-5 h-5 mr-2" />
                Get started
              </a>
            </div>
          </div>
        </div>
      </div>
      <hr/>
      {/* B2B Section */}
      <div className="bg-[#1b1b1b] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">For businesses</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#E5FCFF] sm:text-4xl">
              Enterprise Data Solutions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-400 lg:mx-auto">
              Looking to integrate Surfer Protocol into your business? We offer enterprise solutions with dedicated support and custom features.
            </p>
          </div>
          
          <div className="mt-10 flex justify-center">
            <a target="_blank" href="https://cal.com/sahil-lalani/30min"
               className="inline-flex items-center px-6 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <Phone className="w-5 h-5 mr-2" />
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
      <hr/>
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

const styles = `
  @keyframes infinite-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .animate-infinite-scroll {
    animation: infinite-scroll 40s linear infinite;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

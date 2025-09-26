import { Mail, Github, Twitter, Linkedin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">About Me</h1>
        <p className="text-lg text-slate-600">
          Welcome to my corner of the internet where I share my thoughts on technology and development.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* About Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">Hello, I'm a Developer</h2>
            </div>
            <div className="px-6 pb-6">
              <p className="text-slate-600 leading-relaxed">
                I'm a passionate full-stack developer with expertise in modern web technologies.
                I love exploring new frameworks, building scalable applications, and sharing my knowledge with the community.
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                This blog is my platform to document my learning journey, share tutorials, and discuss the latest trends in web development.
                I believe in continuous learning and the power of sharing knowledge with others.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">Skills & Technologies</h2>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Frontend</h3>
                  <p className="text-sm text-slate-600">
                    React, TypeScript, Next.js, Tailwind CSS, Vue.js
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Backend</h3>
                  <p className="text-sm text-slate-600">
                    Node.js, Python, Go, PostgreSQL, MongoDB
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cloud & DevOps</h3>
                  <p className="text-sm text-slate-600">
                    AWS, Cloudflare, Docker, Kubernetes, CI/CD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">Connect With Me</h2>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
                <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </a>
                <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </a>
                <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Mail className="mr-2 h-4 w-4" />
                  RSS Feed
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">About This Blog</h2>
            </div>
            <div className="px-6 pb-6">
              <p className="text-slate-600 leading-relaxed">
                This blog is built with modern web technologies including React Router 7,
                Cloudflare Workers, and custom UI components. It's designed to be fast,
                scalable, and provide a great reading experience.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Tech Stack:</strong> React Router 7, TypeScript, Tailwind CSS,
                  Cloudflare Workers, D1 Database, R2 Storage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
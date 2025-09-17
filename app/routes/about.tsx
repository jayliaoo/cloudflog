import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Mail, Github, Twitter, Linkedin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">About Me</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to my corner of the internet where I share my thoughts on technology and development.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* About Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hello, I'm a Developer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                I'm a passionate full-stack developer with expertise in modern web technologies.
                I love exploring new frameworks, building scalable applications, and sharing my knowledge with the community.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This blog is my platform to document my learning journey, share tutorials, and discuss the latest trends in web development.
                I believe in continuous learning and the power of sharing knowledge with others.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills & Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Frontend</h3>
                  <p className="text-sm text-muted-foreground">
                    React, TypeScript, Next.js, Tailwind CSS, Vue.js
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Backend</h3>
                  <p className="text-sm text-muted-foreground">
                    Node.js, Python, Go, PostgreSQL, MongoDB
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cloud & DevOps</h3>
                  <p className="text-sm text-muted-foreground">
                    AWS, Cloudflare, Docker, Kubernetes, CI/CD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Social */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                I'm always interested in connecting with fellow developers and tech enthusiasts.
                Feel free to reach out if you have any questions or just want to chat about technology.
              </p>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="mailto:hello@example.com">
                    <Mail className="mr-2 h-4 w-4" />
                    hello@example.com
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect With Me</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild>
                  <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer">
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-4 w-4" />
                    RSS Feed
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About This Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                This blog is built with modern web technologies including React Router 7,
                Cloudflare Workers, and shadcn/ui components. It's designed to be fast,
                scalable, and provide a great reading experience.
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Tech Stack:</strong> React Router 7, TypeScript, Tailwind CSS,
                  Cloudflare Workers, D1 Database, R2 Storage
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Mail, Github, Twitter, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('about.aboutMe')}</h1>
        <p className="text-lg text-slate-600">
          {t('about.welcomeMessage')}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* About Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">{t('about.developerTitle')}</h2>
            </div>
            <div className="px-6 pb-6">
              <p className="text-slate-600 leading-relaxed">
                {t('about.developerDescription')}
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                {t('about.blogPurpose')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">{t('about.skillsTitle')}</h2>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('about.frontend')}</h3>
                  <p className="text-sm text-slate-600">
                    {t('about.frontendSkills')}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('about.backend')}</h3>
                  <p className="text-sm text-slate-600">
                    {t('about.backendSkills')}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('about.cloudDevOps')}</h3>
                  <p className="text-sm text-slate-600">
                    {t('about.cloudDevOpsSkills')}
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
              <h2 className="text-xl font-semibold text-slate-900">{t('about.connectTitle')}</h2>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Github className="mr-2 h-4 w-4" />
                  {t('common.social.github')}
                </a>
                <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Twitter className="mr-2 h-4 w-4" />
                  {t('common.social.twitter')}
                </a>
                <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Linkedin className="mr-2 h-4 w-4" />
                  {t('common.social.linkedin')}
                </a>
                <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center justify-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {t('common.social.rss')}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">{t('about.blogTitle')}</h2>
            </div>
            <div className="px-6 pb-6">
              <p className="text-slate-600 leading-relaxed">
                {t('about.blogDescription')}
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>{t('about.techStackLabel')}</strong> {t('about.techStack')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
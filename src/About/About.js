'use client';
import React from "react";
import Link from "next/link";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

export default function About() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full mb-4">
            About CareerFast
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Connecting Talent With Verified Career Opportunities
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
            CareerFast is an integrated career discovery and hiring platform helping students, freshers, and experienced professionals find verified jobs, internships, scholarships, mentorship, and career-focused courses across India.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">For Job Seekers &amp; Students</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explore curated full-time roles, remote jobs, internships, scholarships, and skill-building courses with transparent role details and streamlined applications.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">For Recruiters &amp; Employers</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Publish verified openings, manage applicants, search candidate profiles, and connect directly with qualified talent faster.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Get in touch</h2>
              <p className="text-sm text-slate-600">
                Questions or partnership inquiries? Reach us at{" "}
                <a href="mailto:careerfastcontact@gmail.com" className="text-violet-700 font-medium underline">
                  careerfastcontact@gmail.com
                </a>
                .
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/jobs" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium no-underline hover:bg-violet-700">
                Browse Jobs
              </Link>
              <Link href="/support" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium no-underline hover:bg-slate-50">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

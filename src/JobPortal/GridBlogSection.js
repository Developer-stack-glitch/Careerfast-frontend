import React from 'react';
import { cn } from "../lib/utils";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const getCategoryBadgeClass = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("devops") || cat.includes("cloud") || cat.includes("tool") || cat.includes("docker") || cat.includes("kubern")) {
    return "badge-blue";
  }
  if (cat.includes("career") || cat.includes("advice") || cat.includes("analyt") || cat.includes("business")) {
    return "badge-green";
  }
  // Default to primary theme color (AI & Learning, Tech, etc.)
  return "badge-theme";
};

const formatBlogDate = (dateStr) => {
  if (!dateStr) return "Sep 21, 2026";
  try {
    const safeStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    const d = new Date(safeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  } catch (e) {
    // fallback
  }
  return "Sep 21, 2026";
};

const formatReadTime = (readingTime) => {
  if (!readingTime) return "8 min read";
  const num = parseInt(readingTime, 10);
  if (!isNaN(num)) {
    return `${num} min read`;
  }
  if (typeof readingTime === 'string') {
    return readingTime.replace(/mins?$/i, '').trim() + ' min read';
  }
  return "8 min read";
};

const GridBlogSection = ({
  title,
  description,
  backgroundLabel,
  backgroundPosition = "right",
  posts = [],
  className,
  onPostClick,
}) => {
  return (
    <section className={cn("hp-grid-section", className)}>
      <div className="hp-grid-header">
        <h2 className="hp-grid-title">{title}</h2>
        {backgroundLabel && (
          <span className={cn(
            "hp-grid-bg-label",
            backgroundPosition === "left" ? "bg-left" : "bg-right"
          )}>
            {backgroundLabel}
          </span>
        )}
        {description && <p className="hp-grid-description">{description}</p>}
      </div>

      <div className="hp-cards-grid">
        {posts.map((post, index) => {
          const categoryClass = getCategoryBadgeClass(post.category);
          const formattedDate = formatBlogDate(post.createdDate);
          const readTimeStr = formatReadTime(post.readTime);

          return (
            <article
              key={post.id || index}
              className="hp-modern-blog-card"
              onClick={() => onPostClick?.(post)}
            >
              {/* Image & Category Badge */}
              <div className="hp-blog-thumb-wrap">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="hp-blog-thumb-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <div className="hp-blog-thumb-placeholder" />
                )}
                <span className={cn("hp-blog-badge", categoryClass)}>
                  {post.category || "Career Advice"}
                </span>
              </div>

              {/* Card Body */}
              <div className="hp-blog-card-body">
                {/* Meta info: Date & Read Time */}
                <div className="hp-blog-meta-row">
                  <div className="hp-blog-meta-item">
                    <Calendar size={14} className="hp-blog-meta-icon" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="hp-blog-meta-item">
                    <Clock size={14} className="hp-blog-meta-icon" />
                    <span>{readTimeStr}</span>
                  </div>
                </div>

                {/* Blog Title */}
                <h3 className="hp-blog-card-title" title={post.title}>
                  {post.title}
                </h3>

                {/* Excerpt / Overview */}
                <p className="hp-blog-card-excerpt">
                  {post.overview || post.description || "Discover how in-demand skills and expert insights can give you a competitive edge in your career."}
                </p>

                {/* Read More Link */}
                <div className="hp-blog-card-action">
                  <span className="hp-blog-read-more">
                    Read More <ArrowRight size={15} className="hp-blog-arrow-icon" />
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default GridBlogSection;

import { useState } from "react";
import { LayoutGrid, Columns3 } from "lucide-react";

import PostCard from "./PostCard";

const PostGrid = ({ posts = [], onSelectPost, onSave, savedPostIds = [] }) => {
  const [viewMode, setViewMode] = useState("masonry");

  const photos = Array.isArray(posts) ? posts.filter(Boolean) : [];

  if (photos.length === 0) return null;

  const hasManyPhotos = photos.length >= 30;

  const masonryColumns = hasManyPhotos
    ? "columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-6 lg:gap-4 xl:columns-7 2xl:columns-8"
    : "columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-5 xl:columns-5";

  const gridColumns = hasManyPhotos
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 lg:gap-4 xl:grid-cols-7 2xl:grid-cols-8"
    : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5";

  const handleSelectPost = (post) => {
    if (post && onSelectPost) {
      onSelectPost(post);
    }
  };

  const handleSave = (post) => {
    if (post && onSave) {
      onSave(post);
    }
  };

  return (
    <section className="w-full" aria-label="Photography gallery">
      {/* Gallery layout controls */}
      <div className="mb-5 flex items-center justify-end gap-3">
        <div
          className="flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1"
          role="group"
          aria-label="Gallery layout"
        >
          <button
            type="button"
            onClick={() => setViewMode("masonry")}
            aria-label="Masonry layout"
            aria-pressed={viewMode === "masonry"}
            title="Masonry layout"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 ${
              viewMode === "masonry"
                ? "bg-[#E60023] text-white"
                : "text-[#767676] hover:bg-[#F7F7F7] hover:text-[#111111]"
            }`}
          >
            <Columns3 size={17} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Uniform grid layout"
            aria-pressed={viewMode === "grid"}
            title="Uniform grid layout"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 ${
              viewMode === "grid"
                ? "bg-[#E60023] text-white"
                : "text-[#767676] hover:bg-[#F7F7F7] hover:text-[#111111]"
            }`}
          >
            <LayoutGrid size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Photographs */}
      <div className={viewMode === "masonry" ? masonryColumns : gridColumns}>
        {photos.map((post, index) => {
          const postId = post._id ?? post.id ?? `photo-${index}`;
          const normalizedId = String(postId);

          const isSaved = savedPostIds.some(
            (savedId) => String(savedId) === normalizedId,
          );

          return (
            <div
              key={normalizedId}
              className={
                viewMode === "masonry"
                  ? "mb-3 break-inside-avoid sm:mb-4"
                  : "min-w-0"
              }
            >
              <PostCard
                post={post}
                onSelectPost={handleSelectPost}
                onSave={handleSave}
                isSaved={isSaved}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PostGrid;

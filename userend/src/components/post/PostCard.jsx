import { useState } from "react";
import { Bookmark } from "lucide-react";

const PostCard = ({ post, onSelectPost, onSave, isSaved = false }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (!post) return null;

  const image =
    (typeof post.image === "string" && post.image) ||
    (typeof post.image?.url === "string" && post.image.url) ||
    post.imageUrl ||
    post.photo ||
    "";

  if (!image || imageFailed) return null;

  const authorName = post.author?.name || post.author?.username || "Photograph";

  const caption = post.caption || "";

  const handleOpen = () => {
    onSelectPost?.(post);
  };

  const handleSave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSave?.(post);
  };

  return (
    <article className="group relative mb-4 break-inside-avoid">
      {/* Photograph */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`View photograph: ${caption || authorName}`}
        className="relative block w-full cursor-pointer overflow-hidden rounded-2xl bg-[#F7F7F7] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2"
      >
        <img
          src={image}
          alt={caption || `Photograph shared by ${authorName}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="block h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
        />

        {/* Hover overlay */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
        />

        {/* Caption */}
        {caption && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-3 translate-y-2 px-4 pb-4 text-left text-sm font-medium leading-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            {caption}
          </span>
        )}
      </button>

      {/* Save button */}
      {onSave && (
        <button
          type="button"
          onClick={handleSave}
          aria-label={isSaved ? "Remove saved photograph" : "Save photograph"}
          aria-pressed={isSaved}
          title={isSaved ? "Remove from saved" : "Save photograph"}
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-transparent shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60023] focus-visible:ring-offset-2 ${
            isSaved
              ? "bg-[#E60023] text-white opacity-100"
              : "bg-white text-[#111111] opacity-100 hover:bg-[#E60023] hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          }`}
        >
          <Bookmark
            size={18}
            strokeWidth={2}
            fill={isSaved ? "currentColor" : "none"}
          />
        </button>
      )}
    </article>
  );
};

export default PostCard;

{/* Modal dialog for album details */}
{selectedAlbum && (
  <div
    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    onClick={closeModal}
  >
    <div
      className={`relative max-w-xl w-full p-4 rounded-lg shadow-lg ${
        isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={closeModal}
        className="absolute top-2 right-2 text-lg font-bold text-gray-400 hover:text-gray-200"
      >
        ×
      </button>
      {/* Show back image if available, otherwise front */}
      <img
        src={
          selectedAlbum.back_image ||
          selectedAlbum.cover_image ||
          selectedAlbum.back_thumb ||
          selectedAlbum.thumb
        }
        alt={selectedAlbum.title}
        className="w-full h-auto max-h-[60vh] object-contain rounded-md mb-4"
      />
      {/* rest of the modal content... */}
    </div>
  </div>
)}

// frontend/src/views/GalleryView.jsx
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function RecordCard({ r }) {
  const src = r?.cover_image || "/static/fallback.jpg";
  return (
    <div style={{ padding: 8 }}>
      <figure style={{ margin: 0 }}>
        <img
          src={src}
          alt={`${r?.title ?? "Record"} cover`}
          onError={(e) => { e.currentTarget.src = "/static/fallback.jpg"; }}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
        />
        <figcaption style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r?.title ?? r?.name ?? "(untitled)"}
          </div>
          <div style={{ opacity: 0.7, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r?.artist ?? r?.artists?.[0]?.name ?? ""}
          </div>
        </figcaption>
      </figure>
    </div>
  );
}

export default function GalleryView({ items = [] }) {
  const settings = {
    dots: false,
    arrows: true,
    infinite: false,
    speed: 300,
    slidesToShow: 6,
    slidesToScroll: 6,
    responsive: [
      { breakpoint: 1536, settings: { slidesToShow: 5, slidesToScroll: 5 } },
      { breakpoint: 1280, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 640,  settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 420,  settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="gallery-slider" style={{ padding: 16 }}>
      <Slider {...settings}>
        {items.map((r) => (
          <RecordCard key={r.id ?? r.imageId ?? r.title} r={r} />
        ))}
      </Slider>
    </div>
  );
}

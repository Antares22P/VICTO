import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import Avatar from "./Avatar";

function ProfileImagePicker({ name, image, onChange }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");

          const size = 256;

          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext("2d");

          // Center crop
          const minSide = Math.min(img.width, img.height);

          const sourceX = (img.width - minSide) / 2;
          const sourceY = (img.height - minSide) / 2;

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            minSide,
            minSide,
            0,
            0,
            size,
            size,
          );

          // Compress to JPEG
          const base64 = canvas.toDataURL("image/jpeg", 0.75);

          resolve(base64);
        };

        img.onerror = reject;

        img.src = event.target.result;
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    // 5 MB original upload limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    try {
      setProcessing(true);

      const base64 = await processImage(file);

      onChange(base64);
    } catch (error) {
      console.error("Image processing error:", error);

      alert("Could not process image.");
    } finally {
      setProcessing(false);

      // Allow selecting the same image again
      event.target.value = "";
    }
  };

  const removeImage = () => {
    onChange(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          position: "relative",
        }}
      >
        <Avatar name={name} image={image} size={96} />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          style={{
            position: "absolute",
            right: "-4px",
            bottom: "-4px",

            width: "32px",
            height: "32px",

            borderRadius: "50%",
            border: "2px solid #080b12",

            background: "#6366f1",
            color: "white",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: processing ? "wait" : "pointer",
          }}
        >
          <Camera size={16} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          display: "none",
        }}
      />

      {processing && (
        <span
          style={{
            fontSize: "12px",
            color: "#8b93a7",
          }}
        >
          Processing image...
        </span>
      )}

      {!processing && image && (
        <button
          type="button"
          onClick={removeImage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",

            border: "none",
            background: "transparent",

            color: "#ef4444",

            cursor: "pointer",

            fontSize: "12px",
          }}
        >
          <X size={14} />
          Remove photo
        </button>
      )}

      {!processing && !image && (
        <span
          style={{
            fontSize: "12px",
            color: "#8b93a7",
          }}
        >
          Click camera to upload
        </span>
      )}
    </div>
  );
}

export default ProfileImagePicker;
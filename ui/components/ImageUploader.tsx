import { Box } from "@chakra-ui/react";
import type { PutBlobResult } from "@vercel/blob";
import { useRef } from "react";

export default function ImageUploader({
  imageUrl,
  onImageUploaded,
}: {
  imageUrl: string;
  onImageUploaded: Function;
}) {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async () => {
    if (!inputFileRef.current?.files) {
      throw new Error("No file selected");
    }

    const file = inputFileRef.current.files[0];

    const response = await fetch(`/api/images?filename=${file.name}`, {
      method: "POST",
      body: file,
    });

    const newBlob = (await response.json()) as PutBlobResult;
    onImageUploaded(newBlob.url);
  };

  return (
    <>
      <input
        name="file"
        ref={inputFileRef}
        type="file"
        onChange={handleUploadImage}
      />
      {imageUrl && (
        <Box width="300px">
          <img src={imageUrl} />
        </Box>
      )}
    </>
  );
}

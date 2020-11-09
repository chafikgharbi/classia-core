import Resizer from "react-image-file-resizer";

function cropResize(file, w, h, m, callback) {
  const img = new Image();
  img.onload = () => {
    Resizer.imageFileResizer(
      file,
      img.width > img.height ? m : w,
      img.height > img.width ? m : w,
      "JPEG",
      100,
      0,
      (uri) => {
        var canvas = document.createElement("canvas");
        crop(uri, canvas, 1).then((canvas) => {
          // `canvas` is the resulting image

          canvas.toBlob((image) => {
            return callback(image);
          });
        });
      },
      "base64"
    );
  };
  img.src = URL.createObjectURL(file);
}

/**
 * @param {string} url - The source image
 * @param {number} aspectRatio - The aspect ratio
 * @return {Promise<HTMLCanvasElement>} A Promise that resolves with the resulting image as a canvas element
 */
function crop(url, canvas, aspectRatio) {
  console.log("cropping");
  // we return a Promise that gets resolved with our canvas element
  return new Promise((resolve) => {
    // this image will hold our source image data
    const inputImage = new Image();

    // we want to wait for our image to load
    inputImage.onload = () => {
      // let's store the width and height of our image
      const inputWidth = inputImage.naturalWidth;
      const inputHeight = inputImage.naturalHeight;

      // get the aspect ratio of the input image
      const inputImageAspectRatio = inputWidth / inputHeight;

      // if it's bigger than our target aspect ratio
      let outputWidth = inputWidth;
      let outputHeight = inputHeight;
      if (inputImageAspectRatio > aspectRatio) {
        outputWidth = inputHeight * aspectRatio;
      } else if (inputImageAspectRatio < aspectRatio) {
        outputHeight = outputWidth / aspectRatio;
      }

      // calculate the position to draw the image at
      const outputX = (outputWidth - inputWidth) * 0.5;
      const outputY = (outputHeight - inputHeight) * 0.5;

      // create a canvas that will present the output image
      const outputImage = canvas;

      // set it to the same size as the image
      outputImage.width = outputWidth;
      outputImage.height = outputHeight;

      console.log(outputWidth, "x", outputHeight);

      // draw our image at position 0, 0 on the canvas
      const ctx = outputImage.getContext("2d");
      ctx.drawImage(inputImage, outputX, outputY);
      resolve(outputImage);
    };

    // start loading our image
    inputImage.src = url;
  });
}

export default cropResize;

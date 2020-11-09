import React, { useEffect, useState } from "react";
import { storage } from "../library/firebase";
import server, { query } from "../library/api";
import cropResize from "../library/crop-resize";

export default function ImageUpload(props) {

  const [image, setImage] = useState(null)
  const [progress, setProgress] = useState(null)

  const handleChange = async event => {
    const file = event.target.files[0]
    if (props.id) {
      handleUpload(file, props.id)
    } else {
      createId(id => {
        console.log(file, id)
        handleUpload(file, id)
      })
    }
  };

  const createId = (_callback) => {
    props.loading(true)
    server({
      method: "post",
      url: "/rows/create",
      data: {
        model: props.model,
        data: props.data
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        console.log(res.data);
        let id = res.data.inserted.insertId
        let ref = res.data.inserted.insertRef
        _callback(id)
        props.createdId(id, ref)
        props.loading(false)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
        //todo delete if not updated or created and same for all other uploads
      });
  };

  const handleUpload = (file, id) => {
    //const fileSize = file.size.toString();
    const fileMedia = file.type.split("/")[0]
    if (fileMedia != "image") {
      alert("Veuillez sélectionner une image")
      return
    }
    cropResize(file, 300, 300, 1200, (image) => {
      if (image) {
        upload(image, id);
      } else {
        alert("Une erreur s'est produite, veuillez réessayer plus tard");
      }
    });
  }

  const upload = (image, id) => {
    const storageRef = storage.ref(`images/${id}/${props.field}`)
    let uploadTask = storageRef.put(image);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // progress function ...
        const uploadProgress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(uploadProgress)
      },
      (error) => {
        // Error function ...
        alert("Une erreur s'est produite, veuillez réessayer plus tard");
      },
      async () => {
        // complete function ...
        await storageRef
          .getDownloadURL()
          .then(async (url) => {
            console.log(url)
            update(url, id)
            setProgress(0)
          });
      }
    );
  }

  const update = (url, id) => {
    props.loading(true)
    let imageData = {}
    imageData[props.field] = url
    server({
      method: "post",
      url: "/rows/update/" + id,
      data: {
        model: props.model,
        data: { ...props.data, ...imageData }
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        setImage(url)
        props.onChange(url)
        props.loading(false)
      })
      .catch(error => {
        console.log(error);
        //todo delete if not updated or created and same for all other uploads
        props.loading(false)
      });
  }

  return (
    <label htmlFor={`upload-${props.field}-${props.id}`}
      className="relative cursor-pointer flex justify-between items-center w-full border border-gray-500 rounded">
      <div className="absolute top-0 left-0" style={{
        width: progress + "%",
        height: "100%",
        background: "rgba(41, 128, 185,0.5)",
        transition: "width 2s"
      }}></div>
      {(!progress || progress == 0) &&
        <div className="bg-white px-2 mx-2 text-xs text-gray-800 absolute top-0" style={{
          transform: "translateY(-50%)"
        }}>
          {props.label}
        </div>
      }
      <div></div>
      <input type="file" id={`upload-${props.field}-${props.id}`} className="hidden" onChange={handleChange} />
      <div className="p-2">
        <img className="rounded" src={image || props.value}
          style={{ width: "118px", height: "118px", objectFit: "cover" }} />
      </div>
    </label>
  );
}
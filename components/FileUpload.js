import React, { useEffect, useState, useRef } from "react";
import { storage } from "../library/firebase";
import server, { query } from "../library/api";
import { __ } from "../library/translation"
import IconButton from '@material-ui/core/IconButton';
import UploadIcon from '@material-ui/icons/CloudUpload';
import CloseIcon from '@material-ui/icons/Close';

export default function ImageUpload(props) {

  const [fileUrl, setFileUrl] = useState(null)
  const [progress, setProgress] = useState(null)

  const input = useRef(null)

  useEffect(() => {
    setFileUrl(props.value)
  }, [props.value])

  const handleChange = async event => {
    const file = event.target.files[0]
    if (props.id) {
      handleUpload(file, props.id)
    } else {
      createId(id => {
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
        let id = res.data.inserted.insertId
        let ref = res.data.inserted.insertRef
        _callback(id)
        props.createdId(id, ref)
        props.loading(false)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  };

  const handleUpload = (file, id) => {
    //const fileSize = file.size.toString();
    const fileType = file.type
    const fileMedia = file.type.split("/")[0]
    if (fileMedia != "image" && (fileMedia != "application" || fileType != "application/pdf")) {
      alert("Veuillez sélectionner un fichier de format PDF of Image")
      return
    }
    upload(file, id);
  }

  const upload = (file, id) => {
    const storageRef = storage.ref(`files/${id}/${props.field}`)
    let uploadTask = storageRef.put(file);
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
        setFileUrl(url)
        props.onChange(url)
        props.loading(false)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  }

  const _delete = () => {
    props.loading(true)
    const storageRef = storage.ref(`files/${props.id}/${props.field}`)
    storageRef.delete().then(() => {
      // File deleted successfully
      update("", props.id)
      setFileUrl(null)
      props.onChange(null)
      console.log("deleted!")
    }).catch((error) => {
      // Uh-oh, an error occurred!
      update("", props.id)
      props.loading(false)
    });
  }

  return (
    <div className="relative text-base text-gray-800 cursor-pointer flex justify-between items-center w-full border border-gray-500 rounded">
      <div className="absolute top-0 left-0" style={{
        width: progress + "%",
        height: "100%",
        background: "rgba(41, 128, 185,0.5)",
        transition: "width 2s"
      }}></div>
      {(!progress || progress == 0) &&
        <div className="bg-white px-1 mx-2 text-xs text-gray-800 absolute top-0" style={{
          transform: "translateY(-50%)"
        }}>
          {props.label}
        </div>
      }
      <div>
        {fileUrl ?
          <a href={fileUrl} target="_blank"
            className="px-3 py-4">Afficher</a> :
          <div className="px-3 py-4" onClick={() => input.current.click()}>
            {__("Sélectionnez ...")}
          </div>
        }
      </div>
      <input ref={input} type="file" className="hidden" onChange={handleChange} />
      <div className="p-2 flex">
        {fileUrl &&
          <IconButton size="small" onClick={_delete}>
            <CloseIcon className="text-gray-700 m-1" />
          </IconButton>
        }
        <IconButton size="small" onClick={() => input.current.click()}>
          <UploadIcon className="text-gray-700 m-1" />
        </IconButton>
      </div>
    </div>
  );
}
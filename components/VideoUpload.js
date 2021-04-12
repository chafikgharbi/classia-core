import React, { useEffect, useState } from "react";
import { storage } from "../library/firebase";
import server, { query } from "../library/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPause, faPlay, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios"


const accessToken = '2251f10bbb8f6388634897d19098af16';

const headerPost = {
  Accept: 'application/vnd.vimeo.*+json;version=3.4',
  Authorization: `bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

export default function VideoUpload(props) {

  const [video, setVideo] = useState(null)
  const [createdId, setCreatedId] = useState(null)
  const [uploadState, setUploadState] = useState(null)
  const [progress, setProgress] = useState(null)
  const [transcoding, setTranscoding] = useState(false)

  var uploadTask = null

  useEffect(() => {
    setVideo(props.value)
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
        setCreatedId(id)
        props.createdId(id, ref)
        props.loading(false)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  };

  const handleUpload = (file, id) => {
    const fileSize = file.size.toString();
    const fileMedia = file.type.split("/")[0]
    if (fileMedia != "video") {
      alert("Veuillez sélectionner une video")
      return
    }
    upload(file, fileSize, id);
  }

  const upload = (file, fileSize, id) => {
    const storageRef = storage.ref(`videos/${id}/${props.field}`)
    let uploadTask = storageRef.put(file);
    setUploadState("start")
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
            setProgress(0)
            uploadVideo(url, fileSize, id, () => {
              storageRef.delete().then(() => {
                // File deleted successfully
                console.log("deleted!")
              }).catch((error) => {
                // Uh-oh, an error occurred!
                console.log("Error!")
              });
            })
          });
      }
    );
  }

  const pauseUpload = () => {
    if (uploadTask) {
      uploadTask.pause()
      setUploadState("pause")
    }
  }

  const resumeUpload = () => {
    if (uploadTask) {
      uploadTask.resume()
      setUploadState("start")
    }
  }

  const cancelUpload = () => {
    if (uploadTask) {
      uploadTask.resume()
      setUploadState("start")
    }
  }

  const uploadVideo = async (uri, fileSize, id, _callback) => {
    setTranscoding(true)
    const response = await axios({
      method: 'post',
      url: `https://api.vimeo.com/me/videos`,
      headers: headerPost,
      data: {
        upload: {
          approach: 'pull',
          size: fileSize,
          link: uri
        },
        name: "Video " + id,
        privacy: {
          comments: "nobody",
          download: false,
          view: "disable",
          embed: "public" // todo: add whitelist system
        },
        embed: {
          buttons: {
            embed: false,
            like: false,
            share: false,
            watchlater: false,
          },
          color: "#2980b9",
          logos: {
            vimeo: false
          },
          title: {
            name: "hide",
            owner: "hide",
            portrait: "hide"
          }
        }
      }
    });

    const video_id = response.data.uri.split("/")[2]

    let videoData = {}
    videoData[props.field] = video_id

    server({
      method: "post",
      url: "/rows/update/" + id,
      data: {
        model: props.model,
        data: { ...props.data, ...videoData }
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(async res => {
        setVideo(video_id)
        props.onChange(video_id)
        setTranscoding(false)
        _callback()
      })
      .catch(error => {
        console.log(error);
      });
  }

  const deleteVideo = async () => {
    if (confirm("Voulez-vous supprimer la video?")) {
      await axios.delete("https://api.vimeo.com/videos/" + video, {
        headers: {
          Authorization: `bearer ${accessToken}`
        }
      }).then(() => {
        // File deleted successfully
      }).catch((error) => {
        // Uh-oh, an error occurred!
      });
      let videoData = {}
      videoData[props.field] = ""
      await server({
        method: "post",
        url: "/rows/update/" + (props.id || createdId),
        data: {
          model: props.model,
          data: { ...props.data, ...videoData }
        },
        headers: { authorization: "Bearer " + props.token }
      }).then(() => {
        setVideo(null)
        props.onChange(null)
      }).catch((error) => {
        // Uh-oh, an error occurred!
      });
    }
  }

  return (
    <div className="relative flex justify-center text-center text-sm bg-gray-100 border border-gray-400 rounded">
      {transcoding &&
        <div
          className="flex items-center font-bold text-center text-white justify-center absolute top-0 left-0 z-10 animated-background-loading"
          style={{ height: "100%", width: "100%" }}>
          Analyse et codage...
            </div>
      }
      {progress > 0 &&
        <div
          className="absolute z-1 top-0 left-0"
          style={{ background: "#1abc9c", height: "100%", width: progress + "%" }}>

        </div>
      }
      {progress > 0 ?
        <div className="relative px-3 py-4">Téléchargement... {progress}%</div> :
        video ?
          <div className="flex items-center px-3 py-4">
            <FontAwesomeIcon icon={faPlay} style={{ fontSize: "15px" }} />
            <div className="mx-3">Video</div>
          </div> :
          <label htmlFor={`upload-${props.field}-${props.id}`} className="relative px-3 py-4 cursor-pointer w-full">
            <input type="file" id={`upload-${props.field}-${props.id}`} className="hidden" onChange={handleChange} />
                  Télécharger une video...
                </label>
      }
      {progress > 0 ?
        <div className="relative flex items-center">
          {uploadState == "start" &&
            < div className="cursor-pointer mx-2"
              style={{ width: "20px", height: "20px" }}
              onClick={pauseUpload}
            >
              <FontAwesomeIcon icon={faPause} style={{ fontSize: "15px" }} />
            </div>
          }
          {uploadState == "pause" &&
            < div className="cursor-pointer mx-2"
              style={{ width: "20px", height: "20px" }}
              onClick={resumeUpload}
            >
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: "15px" }} />
            </div>
          }
          <div className="cursor-pointer mx-2"
            style={{ width: "20px", height: "20px" }}
            onClick={cancelUpload}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "15px" }} />
          </div>
        </div> :
        video && <div className="relative flex items-center">
          <div className="cursor-pointer mx-2"
            style={{ width: "20px", height: "20px" }}
            onClick={deleteVideo}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "15px" }} />
          </div>
        </div>}
    </div>
  );
}
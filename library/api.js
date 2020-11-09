import axios from "axios";

var server = axios.create({
  baseURL: process.env.NODE_ENV === "production"
    ? process.env.serverApi : process.env.serverDevApi,
  json: true,
});

export var query = async (params, _callback, _catch) => {
  const token = params._token
  delete params._token
  await server.get(params._count ? "/rows/count" : "/rows", {
    params, headers: { authorization: "Bearer " + token }
  })
    .then(res => {
      _callback(res)
    })
    .catch(error => {
      _catch(error)
    });
}

export default server
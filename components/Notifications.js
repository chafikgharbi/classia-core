import React, { useState, useEffect } from "react";
import server, { query } from "../library/api";
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MoreVert from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { notifications as notifBuilder } from "src/config"
import CircularProgress from '@material-ui/core/CircularProgress';
import config from "project.config"
import axios from "axios"

function NotificationBody(props) {

  const [page, setPage] = useState({})
  const [body, setBody] = useState("")

  useEffect(() => {
    notifBuilder(props.user, props.token, (notifArray) => {
      let notification = { body: () => { } }
      notifArray.map(notif => {
        if (notif.type && notif.type == props.row._notification_type) {
          notification = notif
        }
      })
      if (notification.body) setBody(notification.body(props.row))
      if (notification.page) setPage(notification.page(props.row))
    })
  }, [props.row])

  return <div onClick={() => {
    props.router.push(page.path, page.link)
    props.onClose()
  }}>
    {body}
  </div>
}

export default function Notifications(props) {

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    setLoading(true)
    notifBuilder(props.user, props.token, (notifArray) => {
      if (notifArray.length > 0) {

        let filters = {}

        notifArray.map(notification => {
          filters = { ...filters, ...notification.filters }
        })

        query({
          ...filters,
          _notification_state: ["=", "active"],
          _join: ["from", "to"],
          _start: 0,
          _limit: 99,
          _token: props.token
        },
          res => {
            console.log(res.data)
            setRows(res.data.rows)
            setLoading(false)
          },
          err => {
            console.log(err);
            setLoading(false)
          }
        )
      }
    })
  }, [])

  const [anchorEl, setAnchorEl] = useState(null)

  const setRowValue = (id, value) => {
    setRows(rows.map(row => {
      return { ...row, ...(row.id == id ? value : []) };
    }))
  }

  const setIgnored = (row) => {
    props.loading(true)
    server({
      method: "post",
      url: "/rows/update/" + row.id,
      data: {
        model: row.model,
        data: { ...JSON.parse(row.data), _notification_state: "ignored" }
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        props.loading(false)
        let newRows = rows.filter(r => r.id != row.id)
        setRows(newRows)
        props.updateCount(-1)
        console.log("ignored", row.id, res)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  }

  const notify = (row) => {
    const push_token = row.from_data && row.from_data.push_token ? row.from_data.push_token
      : row.to_data && row.to_data.push_token ? row.to_data.push_token
        : row.for_data && row.for_data.push_token ? row.for_data.push_token : null

    if (row.from_data) {
      // get parents tokens
    }

    if (push_token) {
      axios({
        method: "post",
        url: "https://fcm.googleapis.com/fcm/send",
        data: {
          to: push_token,
          data: {
            notification: {
              title: "FCM Message",
              body: "This is an FCM Message"
            }
          }
        },
        headers: {
          "Authorization": `key=${process.env.serverKey}`,
          "Content-Type": "application/json",
        }
      })
        .then(res => {
          console.log(res)
        })
        .catch(error => {
          console.log(error)
        });
    }
  }

  return <div style={{ width: "300px", maxWidth: "100%" }}>
    {loading ? <div className="flex justify-center p-10"><CircularProgress size={50} /></div> :
      rows.map((row, index) =>
        <div key={index}>
          <div className="flex items-start hover:bg-gray-200">
            <div className="p-5 flex-grow cursor-pointer">
              <NotificationBody
                user={props.user}
                token={props.token}
                row={row}
                router={props.router}
                onClose={props.onClose}
              />
            </div>
            <div className="py-2">
              <IconButton aria-label="Ignorer" onClick={(event) => {
                setAnchorEl(event.currentTarget);
                setRowValue(row.id, { _open_menu: true })
              }} >
                <MoreVert />
              </IconButton>
              <Menu
                id="long-menu"
                keepMounted
                anchorEl={anchorEl}
                open={row["_open_menu"] || false}
                onClose={() => {
                  setAnchorEl(null)
                  setRowValue(row.id, { _open_menu: false })
                }}
                PaperProps={{
                  style: {
                    maxHeight: 40 * 4.5,
                    width: 'auto',
                  },
                }}
              >
                {config.pushNotifications && <MenuItem onClick={() => notify(row)}>Envoyer une notification</MenuItem>}
                <MenuItem onClick={() => setIgnored(row)}>Ignorer</MenuItem>
              </Menu>
            </div>
          </div>
          <Divider />
        </div>
      )}
  </div>
}
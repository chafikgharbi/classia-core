import { useEffect, useState, Component } from "react"
import firebase, { firestore } from "../library/firebase"
import { query } from "../library/api"
import { makeStyles, withStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Divider from '@material-ui/core/Divider'
import TextField from '@material-ui/core/TextField'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Avatar from '@material-ui/core/Avatar'
import { IconButton } from "@material-ui/core"
import Badge from '@material-ui/core/Badge';
import CloseIcon from '@material-ui/icons/Close';
import ChatBox from "./ChatBox"

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  chatSection: {
    width: '100%',
    height: '70vh',
    padding: 0
  },
  headBG: {
    backgroundColor: '#e0e0e0'
  },
  borderRight500: {
    borderRight: '1px solid #e0e0e0'
  },
  borderLeft500: {
    borderLeft: '1px solid #e0e0e0'
  },
  messageArea: {
    height: '60vh',
    overflowY: 'auto'
  },
  userName: {
    margin: 0
  },
  userType: {
    marginTop: 0
  },
  userTypeText: {
    fontSize: 12
  },
});

const NotifBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))(Badge);

const OnlineBdage = withStyles((theme) => ({
  badge: {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))(Badge);

const UserAvatar = (props) => {
  return <Badge
    color="secondary"
    badgeContent={props.newMessages}
  >
    <OnlineBdage
      overlap="circle"
      badgeContent={props.online ? 1 : 0}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      variant="dot"
    >
      <Avatar alt={`${props.user.last_name} ${props.user.first_name}`}
        src={props.user.photo} />
    </OnlineBdage>
  </Badge>
}

export default function Messages(props) {

  const classes = useStyles()

  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("currentChatUser") || "{}")
  )

  useEffect(() => {
    localStorage.setItem("currentChatUser", JSON.stringify(currentUser))
  }, [currentUser])

  const openChat = props.open && currentUser && currentUser.id

  const [rerenderChat, setRerenderChat] = useState(false)

  useEffect(() => {
    if (rerenderChat) {
      setRerenderChat(false)
    }
  }, [rerenderChat])

  const [search, setSearch] = useState("")

  useEffect(() => {
    const getUsers = () => {
      query({
        model: ["=", "person"],
        ...(search != "" ? {
          first_name: ["starts", search.toLowerCase(), "OR"],
          last_name: ["starts", search.toLowerCase()],
        } : {}),
        email: ["<>", "NULL"],
        _start: 0,
        _limit: 10,
        _token: props.token
      }, res => {
        setUsers(res.data.rows)
      }, (err) => {
        console.log(err)
      })
    }
    getUsers()
    let interval = setInterval(getUsers, 60000 * 5)
    return () => {
      clearInterval(interval)
    }
  }, [search])

  const [rcUsers, setRcUsers] = useState([])

  useEffect(() => {
    if (props.recentChat.length > 0) {

      let rcUsersAuths = ""
      props.recentChat.map(rc => {
        rcUsersAuths += rc.with + ","
      })
      rcUsersAuths = rcUsersAuths.slice(0, -1)

      const getUsers = () => {
        query({
          model: ["=", "person"],
          id: ["in", rcUsersAuths],
          _token: props.token
        }, res => {
          let _rcUsers = []
          props.recentChat.map(rc => {
            let user = res.data.rows.filter(u => u.id == rc.with)[0]
            if (user) _rcUsers.push({ user: user, message: rc })
          })
          setRcUsers(_rcUsers)

        }, (err) => {
          console.log(err)
        })
      }
      getUsers()
      let interval = setInterval(getUsers, 60000 * 5)
      return () => {
        clearInterval(interval)
      }
    }
  }, [props.recentChat])

  return <div {...(props.wrapperProps || {})}
    style={{
      ...((props.wrapperProps || {}).style || {}),
      ...(openChat ? {} : {
        width: "300px"
      })
    }}
  >
    <Paper elevation={3}>
      <div className={"flex items-center justify-between " + (!props.open && " cursor-pointer")}
        onClick={!props.open ? props.openMessages : () => { }}>
        {openChat ?
          <div className="flex items-center">
            <div className="p-2 px-4">
              <Avatar alt={currentUser.last_name + " " + currentUser.first_name}
                src={currentUser.photo} />
            </div>
            <div className="flex items-center p-1 px-0">
              <div className="text-base p-1">{currentUser.last_name} {currentUser.first_name}</div>
              <div className="text-sm text-gray-600 p-1">({props.methods.type(currentUser.type)})</div>
            </div>
          </div> :
          <div className="text-base p-2 px-5">
            Messagerie {props.newMsgs.length > 0 && "(" + props.newMsgs.length + ")"}
          </div>
        }
        {props.open &&
          <IconButton aria-label="Fermer" onClick={props.closeMessages} >
            <CloseIcon />
          </IconButton>
        }
      </div>
      {props.open && <>
        <Divider />
        <Grid container
          className={classes.chatSection}>
          {openChat &&
            <Grid item xs={9}>
              {!rerenderChat &&
                < ChatBox {...props} chat={{ user: currentUser }} classes={classes} />
              }
            </Grid>
          }
          <Grid item xs={openChat ? 3 : 12}
            className={openChat && classes.borderLeft500}>
            <div className="flex flex-col" style={{ height: "80vh" }} >
              <Grid item xs={12}
                style={{ padding: '10px', flexBasis: 0 }}>
                <TextField value={search}
                  placeholder="Nom ou prénom..."
                  InputProps={{ disableUnderline: true }}
                  fullWidth
                  onChange={e => setSearch(e.target.value)}
                />
              </Grid>
              <Divider />
              <List className="overflow-auto">
                {(!search || search == "") && rcUsers.map((chat, index) =>
                  <ListItem button key="RemySharp" key={index}
                    onClick={() => {
                      setCurrentUser(chat.user)
                      setRerenderChat(true)
                    }}>
                    <ListItemIcon>
                      <UserAvatar user={chat.user}
                        online={false}
                        newMessages={props.newMsgs.filter(m => m.from == chat.user.id).length} />
                    </ListItemIcon>
                    <Grid container>
                      <Grid item xs={12}>
                        <ListItemText
                          classes={{ root: classes.userName }}
                          primary={`${chat.user.last_name} ${chat.user.first_name}`}>
                          {chat.user.last_name} {chat.user.first_name}
                        </ListItemText>
                      </Grid>
                      <Grid item xs={12}>
                        <ListItemText
                          classes={{ root: classes.userType, secondary: classes.userTypeText }}
                          align="left"
                          secondary={props.methods.type(chat.user.type)}></ListItemText>
                      </Grid>
                    </Grid>
                  </ListItem>
                )}
                {(!search || search == "") && rcUsers.length > 0 && <Divider />}
                {users.map((u, index) =>
                  <ListItem button key="RemySharp" key={index}
                    onClick={() => {
                      setCurrentUser(u)
                      setRerenderChat(true)
                    }}>
                    <ListItemIcon>
                      <UserAvatar user={u}
                        online={u._active_at && u._server_time && u._active_at > (u._server_time - 60000 * 5)}
                        newMessages={rcUsers.length > 0 ? 0 :
                          props.newMsgs.filter(m => m.from == u.id).length}
                      />
                    </ListItemIcon>
                    <Grid container>
                      <Grid item xs={12}>
                        <ListItemText
                          classes={{ root: classes.userName }}
                          primary={`${u.last_name} ${u.first_name}`}>
                          {u.last_name} {u.first_name}
                        </ListItemText>
                      </Grid>
                      <Grid item xs={12}>
                        <ListItemText
                          classes={{ root: classes.userType, secondary: classes.userTypeText }}
                          align="left"
                          secondary={props.methods.type(u.type)}></ListItemText>
                      </Grid>
                    </Grid>
                  </ListItem>
                )}
              </List>
            </div>
          </Grid>
        </Grid>
      </>}
    </Paper>
  </div>
}
import { Component } from "react"
import firebase, { firestore } from "../library/firebase"
import Grid from '@material-ui/core/Grid'
import Divider from '@material-ui/core/Divider'
import TextField from '@material-ui/core/TextField'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Avatar from '@material-ui/core/Avatar'
import SendIcon from '@material-ui/icons/Send'
import { IconButton } from "@material-ui/core"
import moment from "moment"
import CircularProgress from '@material-ui/core/CircularProgress';

var chatListener = () => { }

export default class ChatBox extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: "",
      messages: [],
      loading: true,
      windowActive: true,
      limit: 10
    }
    this.listener = () => { }
  }

  componentDidMount = () => {
    if (this.props.chat.user && this.props.chat.user.id) {
      chatListener = firestore.collection("messages")
        .where("users", "in", [
          this.props.chat.user.id + "," + this.props.user.row_id,
          this.props.user.row_id + "," + this.props.chat.user.id
        ])
        .orderBy("sentAt", "desc")
        .limit(this.state.limit)
        .onSnapshot((snapshot) => {
          let newMessages = this.state.messages
          snapshot.docChanges().forEach((change) => {
            const docData = change.doc.data()
            const message = {
              id: change.doc.id, ...docData,
              sentAtUnix: docData.sentAt ? docData.sentAt.toMillis().toString() : Date.now().toString()
            }
            if (change.type === "added") {
              newMessages.push(message)
              this.setSeen(message)
            }
            if (change.type === "removed") {
              let _messages = this.state.messages.filter(m => m.id != change.doc.id)
              this.setState({ messages: _messages })
            }
            if (change.type === "modified") {
              let _messages = this.state.messages.map(m => {
                return m.id == change.doc.id ? message : m
              });
              this.setState({ messages: _messages })
            }
            // todo: stop loading
          })
          if (newMessages.length > 0) {
            newMessages = this.sortMessages(newMessages)
            this.setState({ messages: newMessages }, () => {
              if (this.messageArea) {
                this.messageArea.scrollTop = this.messageArea.scrollHeight
              }
            })
          }
        })
    }

    this.setState({ loading: false })

    window.addEventListener('blur', () => this.handleActivity(false))
    window.addEventListener('focus', () => this.handleActivity(true))
  }

  componentWillUnmount() {
    chatListener()
    window.removeEventListener('blur', this.handleActivity)
    window.removeEventListener('focus', this.handleActivity)
  }

  loadMore = (scrollHeight) => {
    this.setState({ loading: true })
    firestore.collection("messages")
      .where("users", "in", [
        this.props.chat.user.row_id + "," + this.props.user.row_id,
        this.props.user.row_id + "," + this.props.chat.user.id
      ])
      .orderBy("sentAt", "desc")
      .startAfter(this.state.messages[0].sentAt)
      .limit(this.state.limit)
      .get()
      .then((querySnapshot) => {
        let moreMessages = []
        querySnapshot.forEach((doc) => {
          const docData = doc.data()
          const message = {
            id: doc.id, ...docData,
            sentAtUnix: docData.sentAt ? docData.sentAt.toMillis().toString() : Date.now().toString()
          }
          moreMessages.unshift(message)
        });
        if (moreMessages.length > 0) {
          this.setState({ messages: [...moreMessages, ...this.state.messages] }, () => {
            if (this.messageArea) {
              this.messageArea.scrollTop = this.messageArea.scrollHeight - scrollHeight
            }
          })
        }
        this.setState({ loading: false })
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
        this.setState({ loading: false })
      });
  }

  setSeen = (message) => {
    if (this.state.windowActive
      && message.from == this.props.chat.user.id
      && !message.seenAt
    ) {
      firestore.collection('messages').doc(message.id).set({
        seenAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    }
  }

  handleActivity = (isActive) => {
    return this.setState({ windowActive: isActive }, () => {
      if (isActive) {
        this.state.messages.map(m => this.setSeen(m))
      }
    })
  }

  sortMessages = (messages) => {
    let sortedMessages = messages.sort((a, b) => {
      return parseInt(a.sentAtUnix) - parseInt(b.sentAtUnix);
    });
    return sortedMessages
  }

  keyPress = (e) => {
    if (e.keyCode == 13 && !e.shiftKey) {
      this.send()
      e.preventDefault()
    }
  }

  send = async () => {
    // todo: start loading
    const text = this.state.text
    this.setState({ text: "" })
    if (text && text != "") {
      let message = {
        content: text,
        from: this.props.user.row_id,
        to: this.props.chat.user.id,
        users: this.props.user.row_id + "," + this.props.chat.user.id,
        tenant: this.props.tenant.id,
        seenAt: false
      }
      firestore.collection('messages').add({
        ...message,
        sentAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).then(() => {
        // sent
      }).catch(err => {
        console.log(err)
      });

      let recentChat = this.props.recentChat

      if ((recentChat[0] || {}).with != message.to) {
        let withUser = recentChat.filter(rc => rc.with == message.to)[0]
        if (withUser) recentChat = recentChat.filter(rc => rc.with != message.to)
        recentChat.unshift({ ...message, with: message.to })
        firestore.collection('recentChat').doc(this.props.tenant.id + "-" + this.props.user.row_id).set({
          user: this.props.user.row_id,
          chat: recentChat
        }, { merge: true })
      }
    }
  }

  render() {
    return this.props.chat.user && this.props.chat.user.id ?
      <div className="flex flex-col" style={{ height: "80vh" }} >
        {this.state.loading &&
          <div className="flex justify-center"><CircularProgress size={50} /></div>
        }
        <List className={this.props.classes.messageArea}
          ref={ref => this.messageArea = ref}
          onScroll={() => {
            if (this.messageArea.scrollTop < 1) {
              this.loadMore(this.messageArea.scrollHeight)
            }
          }}
        >
          {this.state.messages.map((m, index) =>
            <ListItem key={index}>
              {m.from == this.props.user.row_id ? <>
                <Grid container>
                  <Grid item xs={12}>
                    <ListItemText
                      align="right"
                      primary={m.content} />
                  </Grid>
                  <Grid item xs={12}>
                    <ListItemText
                      align="right"
                      secondary={moment(m.sentAtUnix, "x").format("hh:mm")} />
                    {(index == this.state.messages.length - 1)
                      && m.seenAt &&
                      <ListItemText
                        align="right"
                        secondary="Vu"></ListItemText>
                    }
                  </Grid>
                </Grid>
              </> : <>
                <ListItemIcon>
                  <Avatar
                    alt={`${this.props.chat.user.last_name} ${this.props.chat.user.first_name}`}
                    src={this.props.chat.user.photo}
                  />
                </ListItemIcon>
                <Grid container>
                  <Grid item xs={12}>
                    <ListItemText
                      align="left"
                      primary={m.content} />
                  </Grid>
                  <Grid item xs={12}>
                    <ListItemText
                      align="left"
                      secondary={moment(m.sentAtUnix, "x").format("hh:mm")} />
                    {(index == this.state.messages.length - 1) && m.seenAt
                      && m.from == this.props.user.row_id &&
                      <ListItemText
                        align="right"
                        secondary="Vu"></ListItemText>
                    }
                  </Grid>
                </Grid>
              </>}
            </ListItem>
          )}
        </List>
        <Divider />
        <Grid container style={{ padding: '20px' }}>
          <Grid item xs={11}>
            <TextField
              multiline
              InputProps={{ disableUnderline: true }}
              onKeyDown={this.keyPress}
              value={this.state.text}
              placeholder="Message..."
              fullWidth
              onChange={e => this.setState({ text: e.target.value })} />
          </Grid>
          <Grid item xs={1} align="right">
            <IconButton color="primary" aria-label="add"
              onClick={() => this.send()}><SendIcon />
            </IconButton>
          </Grid>
        </Grid>
      </div> :
      <div>Selèctionnez un utilisateur</div>
  }
}
import React, { useState, useEffect } from "react"
import Link from 'next/link'
import { __ } from "../library/translation"
import firebase from "../library/firebase"
import Divider from '@material-ui/core/Divider'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Collapse from '@material-ui/core/Collapse'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import InboxIcon from '@material-ui/icons/MoveToInbox'
import { menu as configMenu } from "src/config"

const useStyles = makeStyles((theme) => ({
  list: {
    width: '100%',
    maxWidth: 360,
    color: theme.palette.secondary.light
  },
  nested: {
    paddingLeft: theme.spacing(4),
    color: theme.palette.primary.contrastText
  },
  icon: {
    width: "25px",
    height: "25px",
    opacity: "0.8",
    color: theme.palette.secondary.light
  },
  text: {
    color: theme.palette.primary.contrastText
  },
}));

export default function Sidebar(props) {
  const classes = useStyles();

  const [menu, setMenu] = useState([])

  useEffect(() => {
    setMenu(configMenu(props.user, classes))
  }, [props])

  const toggleItem = (group, index) => {
    let newMenu = menu
    newMenu[group][index].open = !newMenu[group][index].open
    console.log(newMenu)
    setMenu([...newMenu])
  }

  function logout() {
    firebase.auth().signOut()
      .then(() => {
        // Sign-out successful.
        //Router.push('/login')
      })
      .catch((error) => {
        // An error happened
      });
  }

  return (
    <>
      <div className="pt-3"></div>

      {menu.map((list, groupIndex) =>
        <div key={groupIndex}>
          {groupIndex > 0 && <Divider />}
          <List className={classes.list}>
            {list.map((item, index) => !item.items ?
              <Link href={item.link} key={index}>
                <ListItem button component="a" onClick={props.onClose}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText className={classes.text} primary={__(item.title)} />
                </ListItem>
              </Link> :
              <div key={index}>
                <ListItem button onClick={() => toggleItem(groupIndex, index)}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText className={classes.text} primary={__(item.title)} />
                  {item.open ? <ExpandLess className={classes.text} />
                    : <ExpandMore className={classes.text} />}
                </ListItem>
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.items.map((item, index) =>
                      <Link href={item.link} key={index}>
                        <ListItem button className={classes.nested} component="a" onClick={props.onClose}>
                          <ListItemText className={classes.text} primary={__(item.title)} />
                        </ListItem>
                      </Link>
                    )}
                  </List>
                </Collapse>
              </div>
            )}
          </List>
        </div>)}
      <Divider />
      <List className={classes.list}>
        <ListItem button onClick={logout}>
          <ListItemIcon>
            <InboxIcon className={classes.icon} />
          </ListItemIcon>
          <ListItemText className={classes.text} primary={__("Déconnexion")} />
        </ListItem>
      </List>
    </>
  );
}
import React, { useState, useEffect } from 'react'
import { query } from "../library/api"
import AppBar from '@material-ui/core/AppBar'
import CssBaseline from '@material-ui/core/CssBaseline'
import Drawer from '@material-ui/core/Drawer'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import LanguageIcon from '@material-ui/icons/Language'
import CalendarIcon from '@material-ui/icons/Event'
import LogoIcon from '@material-ui/icons/DonutSmall'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Avatar from '@material-ui/core/Avatar'
import Badge from '@material-ui/core/Badge'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import NotificationsIcon from '@material-ui/icons/Notifications'
import ChatBubbleIcon from '@material-ui/icons/ChatBubble'
import Sidebar from "./Sidebar"
import { notifications as notifBuilder } from "src/config"
import Notifications from "./Notifications"
import Messages from "./Messages"
import firebase, { firestore } from "../library/firebase"
import config from "../../project.config"

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    drawer: {
        [theme.breakpoints.up('md')]: {
            width: drawerWidth,
            flexShrink: 0
        },
    },
    appBar: {
        background: "white",
        color: "inherit",
        padding: 0,
        [theme.breakpoints.up('md')]: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
        }
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    select: {
        '&:before': {
            borderColor: "rgab(0,0,0,0)",
        },
        '&:after': {
            borderColor: "rgab(0,0,0,0)",
        }
    },
    avatar: {
        width: theme.spacing(4),
        height: theme.spacing(4),
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    topbar: {
        background: theme.palette.secondary.main,
        color: "white"
    },
    drawerPaper: {
        padding: 0,
        border: 0,
        width: drawerWidth,
        background: theme.palette.primary.dark
    },
    content: {
        flexGrow: 1,
        overflow: "hidden",
        padding: theme.spacing(3),
    },
}));

function Layout(props) {
    const { window } = props;
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = <>
        <div className={`${classes.toolbar} ${classes.topbar} text-xl font-bold flex items-center px-4`}>
            <div className="px-1"><LogoIcon color="inherit" /></div><div className="px-6">Classia</div>
        </div>
        <Sidebar {...props} onClose={() => setMobileOpen(false)} />
    </>

    const container = window !== undefined ? () => window().document.body : undefined;

    const [openNotif, setOpenNotif] = useState(false)


    const [years, setYears] = useState([])

    const initYears = () => {
        let years = []
        for (let i = 10; i >= 0; i--) {
            years.unshift(`${new Date().getFullYear() - i}/${new Date().getFullYear() + 1 - i}`);
        }
        setYears(years)
    }

    useEffect(() => {
        initYears()
    }, [])

    const styles = theme => ({
        root: {
            background: "blue",
        },
        whiteColor: {
            color: "white"
        }
    });

    const [notifCount, setNotifCount] = useState(0)

    useEffect(() => {
        notifBuilder(props.user, props.token, (notifArray) => {
            if (notifArray.length > 0) {
                let filters = {}
                notifArray.map(notification => {
                    filters = { ...filters, ...notification.filters }
                })
                query({
                    ...filters,
                    _count: [],
                    _notification_state: ["=", "active"],
                    scholar_year: ["=", props.state.scholarYear],
                    _token: props.token
                },
                    res => {
                        setNotifCount(res.data.count)
                    },
                    err => {
                        console.log(err);
                    }
                )
            }
        })
    }, [])

    const [newMsgs, setNewMsgs] = useState([])
    const [recentChat, setRecentChat] = useState([])

    // get and set last opened chat from localstorage
    const [openMessages, setOpenMessages] = useState(localStorage.getItem("openMessages") === "true")

    useEffect(() => {
        if (config.chat && props.user.row_id) {
            localStorage.setItem("openMessages", openMessages)
            if (!openMessages) {
                localStorage.setItem("currentChatUser", "{}")
            }
        }
    }, [openMessages])


    var messagesListener = () => { }
    var rcListener = () => { }

    useEffect(() => {
        if (config.chat && props.user.row_id) {
            messagesListener = firestore.collection("messages")
                .where("to", "==", props.user.row_id)
                .where("seenAt", "==", false)
                .onSnapshot((snapshot) => {

                    let _newMsgs = []
                    let _recentChat = recentChat

                    snapshot.docChanges().forEach((change) => {
                        const docData = change.doc.data()

                        if (change.type === "added") {
                            console.log("rcb", _recentChat)
                            _recentChat = _recentChat.filter(c => c.with != docData.from)
                            console.log("rca", _recentChat)
                            _recentChat.unshift({ id: change.doc.id, with: docData.from, ...docData })
                            console.log("rcu", _recentChat)
                            _newMsgs.push({ id: change.doc.id, ...docData })
                        }
                        if (change.type === "modified") {
                            _recentChat = _recentChat.filter(c => c.with != docData.from)
                            _recentChat.unshift({ id: change.doc.id, with: docData.from, ...docData })
                            _newMsgs = _newMsgs.filter(m => m.id != change.doc.id)
                        }
                    })

                    setNewMsgs(_newMsgs)

                    if (_recentChat.length > 0) {
                        firestore.collection('recentChat').doc(props.tenant.id + "-" + props.user.row_id).set({
                            user: props.user.row_id,
                            chat: _recentChat
                        }, { merge: true })
                    }

                })

            rcListener = firestore.collection("recentChat")
                .where("user", "==", props.user.row_id)
                .onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        let _recentChat = recentChat
                        let docRecentChat = (change.doc.data() || {}).chat || []
                        docRecentChat.map(rc => {
                            _recentChat = _recentChat.filter(c => c.with != rc.with)
                            _recentChat.push(rc)
                        })
                        setRecentChat(_recentChat)
                    })
                })

            return () => {
                messagesListener()
                rcListener()
            }
        }
    }, [])

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" elevation={1} className={classes.appBar}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className={classes.menuButton}
                    >
                        <MenuIcon />
                    </IconButton>
                    <div className="px-2 cursor-pointer" onClick={() => props.router.back()}><ArrowBackIcon /></div>
                    <div className="flex-grow flex items-center">
                        {(!config.logo || config.logo == "image" || config.logo == "image-title") &&
                            <img src={props.tenant.logo} style={{ height: "50px" }} />
                        }
                        {(!config.logo || config.logo == "title" || config.logo == "image-title") &&
                            <Typography variant="h6" noWrap><div className="mx-3">{props.tenant.title}</div></Typography>
                        }
                    </div>
                    <div className="flex items-center mx-2">
                        <div className="px-2"><CalendarIcon /></div>
                        <Select
                            className={classes.select}
                            disableUnderline={true}
                            labelId="years"
                            value={years.length > 0 ? (props.state.scholarYear || "") : ""}
                            onChange={e => {
                                props.setState({ scholarYear: e.target.value })
                                localStorage.setItem("scholarYear", e.target.value)
                                props.rerender(true)
                            }}
                            displayEmpty
                            label="Année scholaire"
                        >
                            <MenuItem value="">Tous les année</MenuItem>
                            {years.map((year, index) => {
                                return <MenuItem key={index} value={year}>{year}</MenuItem>
                            })}
                        </Select>
                    </div>

                    {config.lang.length > 1 &&
                        <div className="flex items-center mx-2">
                            <div className="px-2"><LanguageIcon /></div>
                            <Select
                                className={classes.select}
                                disableUnderline={true}
                                labelId="lang"
                                value={props.state.lang || "fr"}
                                onChange={e => {
                                    props.setState({ lang: e.target.value })
                                    localStorage.setItem("language", e.target.value)
                                }}
                                displayEmpty
                                label="La langue"
                            >
                                <MenuItem value="fr">Francais</MenuItem>
                                <MenuItem value="ar">Arabe</MenuItem>
                            </Select>
                        </div>
                    }
                    <div className="flex items-center mx-1">
                        {config.chat && props.user.row_id &&
                            <IconButton aria-label={`Afficher les ${newMsgs.length} messages`}
                                color="inherit" onClick={() => setOpenMessages(true)}>
                                <Badge badgeContent={newMsgs.length} color="secondary">
                                    <ChatBubbleIcon />
                                </Badge>
                            </IconButton>
                        }
                        <IconButton aria-label={`Afficher les ${notifCount} notifications`}
                            color="inherit" onClick={() => setOpenNotif(true)}>
                            <Badge badgeContent={notifCount} color="secondary">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </div>

                    <div className="flex items-center mx-2">
                        <Avatar alt="Profile Picture" src={props.photo || ""} className={classes.avatar} />
                        <div className="hidden sm:block">
                            <div className="text-md font-bold">
                                {props.user.last_name} {props.user.first_name}
                            </div>
                            <div className="text-gray-700" style={{ fontSize: "11px" }}>{props.methods.type(props.user.type)}</div>
                        </div>
                    </div>
                </Toolbar>
            </AppBar>
            <nav className={classes.drawer} aria-label="menu">
                {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                <Hidden mdUp implementation="css">
                    <Drawer
                        container={container}
                        variant="temporary"
                        anchor="left"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
                <Hidden smDown implementation="css">
                    <Drawer
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        variant="permanent"
                        open
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
            </nav>
            <main className={classes.content}>
                <div className={classes.toolbar} />
                {props.children}
                {config.chat && props.user.row_id &&
                    <Messages {...props}
                        wrapperProps={{
                            className: "fixed right-0 bottom-0 px-5",
                            style: { width: "1000px", maxWidth: "100%", zIndex: "9999" }
                        }}
                        newMsgs={newMsgs}
                        recentChat={recentChat}
                        open={openMessages}
                        openMessages={() => setOpenMessages(true)}
                        closeMessages={() => setOpenMessages(false)} />
                }
            </main>
            <Drawer
                anchor="right"
                open={openNotif}
                onClose={() => setOpenNotif(false)}>
                <Notifications
                    {...props}
                    onClose={() => setOpenNotif(false)}
                    updateCount={(value) =>
                        setNotifCount(notifCount + value)
                    }
                />
            </Drawer>
        </div >
    );
}

export default Layout;
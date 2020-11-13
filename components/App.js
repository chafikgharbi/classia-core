import React, { useState, useEffect } from "react"
import Head from "next/head"
import Router, { useRouter } from "next/router"
import Layout from "./Layout"
import firebase from "../library/firebase"
import server from "../library/api"
import "../assets/styles.css"
import * as store from "src/store"
import Direction from "./Direction"
import { __ } from "../library/translation"
import moment from "moment"
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import CircularProgress from '@material-ui/core/CircularProgress'
import NextNprogress from 'nextjs-progressbar'
import numeral from "numeral"
import config from "project.config"

function App({ Component, pageProps }) {

  const [state, _setState] = useState({ lang: config.lang[0], ...store.state })

  const setState = (newState) => {
    _setState({ ...state, ...newState })
  }

  const methods = {
    ...store.methods(state, setState),
    price: (value) => {
      return numeral(value).format('0,0[.]00') + " " + (tenant.currency || "DA").toUpperCase()
    }
  }

  const router = useRouter()

  const theme = createMuiTheme({
    direction: state.lang == "ar" ? 'rtl' : 'ltr',
    typography: {
      fontFamily: [
        state.lang == "ar" ? 'Almarai' : 'Poppins',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(',')
    },
    palette: {
      primary: {
        light: (config.palette.primary || {}).light || '#474f97',
        main: (config.palette.primary || {}).main || '#1a237e',
        dark: (config.palette.primary || {}).dark || '#121858',
        contrastText: '#fff',
      },
      secondary: {
        light: (config.palette.secondary || {}).light || '#ffcf33',
        main: (config.palette.secondary || {}).main || '#F8BF00',
        dark: (config.palette.secondary || {}).dark || '#b28900',
        contrastText: '#000',
      },
    },
    overrides: {
      MuiPaper: {
        root: {
          padding: "5px"
        },
        rounded: {
          borderRadius: "6px"
        },
        elevation1: {
          boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.12), 0px 1px 1px 0px rgba(0,0,0,0.06), 0px 1px 3px 0px rgba(0,0,0,0.04)"
        },
      },
    },
  });

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({})
  const [token, setToken] = useState(null)

  const [tenant, setTenant] = useState({})
  const [forbidden, setForbidden] = useState(true)
  const [isPublic, setPublic] = useState(false)

  const [rerender, setRerender] = useState(false);

  useEffect(() => {
    if (rerender) {
      setRerender(false)
    }
  }, [rerender])

  useEffect(() => {
    if (config.forbidden) {
      let forbidden = false
      for (const [key, value] of Object.entries(config.forbidden)) {
        if (key == router.pathname
          || (
            key.includes("*")
            && router.pathname.startsWith(key.split("*")[0])
          )
        ) {
          if (value.includes(user.role)) forbidden = true
        }
      }
      setForbidden(forbidden)
    }
  }, [user])

  // set online
  // todo: if messaging module is activated
  useEffect(() => {

    const setOnline = () => {
      if (token) {
        server({
          method: "post",
          url: "/rows/update/" + user.id,
          data: {
            data: { ...user, _active_at: "_server_time" }
          },
          headers: { authorization: "Bearer " + token }
        })
          .then(res => {
            console.log("online updated")
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

    //console.log("Updating online")

    //todo: reactivate
    //setOnline()

    //let interval = setInterval(setOnline, 60000 * 5)

    return () => {
      //clearInterval(interval)
    }
  }, [user.id])

  const getToken = (_callback) => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        user.getIdToken(true).then(idToken => {
          setToken(idToken)
          _callback(idToken)
        })
          .catch(error => {
            console.log("Error getting auth token");
          });
      } else {
        setToken("")
        _callback("")
      }
    });
  }

  const routing = (user) => {
    if (user) {
      if (Router.pathname == "/login") router.push("/")
      setPublic(false)
    } else {
      if (!config.public.includes(Router.pathname)) {
        window.location.href = "/login"
      } else {
        setPublic(true)
      }
    }
  }

  const getTenant = (user, token) => {
    server({
      method: "get",
      url: "/tenants/current",
      headers: { authorization: "Bearer " + token }
    })
      .then(res => {
        let tenant = res.data
        setTenant(tenant)
        setLoading(false)
      })
      .catch(error => {
        console.log(error)
        setLoading(false)
      });
  }

  const getUser = (user, token) => {
    if (user) {
      server({
        method: "get",
        url: "/user",
        headers: { authorization: "Bearer " + token }
      })
        .then(res => {
          let user = res.data
          if (user.role == "super") {
            user.role = "admin"
            user.superAdmin = true
          }
          setUser(user)
        })
        .catch(error => {
          console.log(error);
        });
    }
  }

  const authListener = () => {
    firebase.auth().onAuthStateChanged(user => {
      routing(user)
      getToken(token => {
        getUser(user, token)
        getTenant(user, token)
      })
    });
  }

  useEffect(() => {
    let tokenInterval = setInterval(() => {
      getToken(() => { })
    }, 15 * 60 * 1000)
    return () => {
      clearInterval(tokenInterval)
    }
  }, [])

  useEffect(() => {

    authListener()

    if (config.lang.length > 1) {
      setState({ lang: localStorage.getItem("language") })
    } else {
      localStorage.setItem("language", config.lang[0])
    }

    // todo: get latest year automatically in or condition
    let scholarYear = localStorage.getItem("scholarYear") || "2020/2021"
    setState({ scholarYear })

  }, [pageProps])

  const header = <Head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, user-scalable=no' />
    <meta name='description' content='Application Ecole' />
    <meta name='keywords' content='Keywords' />

    <title>{tenant.title} | Classia</title>

    {/*<link rel="manifest" href="/manifest.json" />

    <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
    <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
    <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
    <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
    <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
    <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
    <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-icon-192x192.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

    <meta name="theme-color" content="#2196f3" />*/}
  </Head>

  if (router.query.noFrame)
    return <>{header}
      {!rerender && user.id && tenant.id && token !== null && <>
        {!forbidden ?
          <Component
            user={user}
            token={token}
            tenant={tenant}
            state={state}
            setState={setState}
            methods={methods}
            rerender={setRerender}
            router={router}
            loading={(loading) => setLoading(loading)}
            {...pageProps}
          />
          : <div>Forbidden</div>
        }
      </>
      }
    </>

  return <>
    {header}
    {state.lang == "ar" &&
      <style global jsx>{`
            body {
              direction: rtl;
            }
            body input, select, .MuiInputBase-input {
              text-align: right !important;
            }
          `}
      </style>
    }
    <div className="z-100">
      <NextNprogress
        color="#e74c3c"
        startPosition={0.3}
        stopDelayMs={200}
        height="5"
      />
    </div>
    <Direction dir={state.lang == "ar" ? "rtl" : "ltr"}>
      <ThemeProvider theme={theme}>
        <div dir={state.lang == "ar" ? "rtl" : "ltr"}>
          {loading && <>
            <div className="fixed top-0 left-0 h-screen w-full"
              style={{ zIndex: 9999, background: "rgba(255,255,255,0.2" }}
            ></div>
            <CircularProgress
              className="fixed"
              style={{ zIndex: 9999, top: "50%", left: "50%", margin: "-25px 0 0 -25px" }}
              size={50} />
          </>}
          {!rerender && tenant.id &&
            <>
              {!isPublic ?
                <>
                  {user.id && token !== null &&
                    <Layout
                      user={user}
                      token={token}
                      tenant={tenant}
                      state={state}
                      setState={setState}
                      methods={methods}
                      rerender={setRerender}
                      router={router}
                      loading={(loading) => setLoading(loading)}
                    >
                      {!forbidden ?
                        <Component
                          user={user}
                          token={token}
                          tenant={tenant}
                          state={state}
                          setState={setState}
                          methods={methods}
                          rerender={setRerender} x
                          router={router}
                          loading={(loading) => setLoading(loading)}
                          {...pageProps}
                        />
                        : <div>Forbidden</div>
                      }
                    </Layout>
                  }
                </> : !forbidden ?
                  <Component
                    user={user}
                    token={token}
                    tenant={tenant}
                    query={router.query}
                    rerender={setRerender}
                    loading={(loading) => setLoading(loading)}
                    {...pageProps}
                  />
                  : <div>Forbidden</div>
              }
            </>
          }
        </div>
      </ThemeProvider>
    </Direction>
  </>
}

const _App = () => {
  return App()
}

export default App;

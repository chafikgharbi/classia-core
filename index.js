import App from "./components/App"
import Entries from "./components/Entries"
import Rows from "./components/Rows"
import Chart from "./components/Chart"
import CountBox from "./components/CountBox"
import Profile from "./components/Profile"
import SVGIcon from "./library/icon"
import firebase, { firestore, storage } from "./library/firebase"
import server, { query } from "./library/api"
import { _t } from "./library/translation"

const __ = _t

// todo: remove this comment line

export {
  __,
  App,
  Rows,
  Chart,
  SVGIcon,
  query,
  server,
  firebase,
  firestore,
  storage,
  Entries,
  CountBox,
  Profile
}
import { useEffect, useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print';
import { query, __ } from "classia"
import moment from "moment"
import Paper from '@material-ui/core/Paper'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Button from '@material-ui/core/Button'
import EditIcon from '@material-ui/icons/Edit'
import PrintIcon from '@material-ui/icons/Print'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import { makeStyles } from '@material-ui/core';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    paddingBottom: 0
  }
}));

export default function Profile(props) {

  const classes = useStyles()

  const [fields, setFields] = useState([])

  const [loading, setLoading] = useState(true)

  const [notFound, setNotfound] = useState(false)

  const [row, setRow] = useState({})
  const [openEditor, setOpenEditor] = useState(false)
  const [value, setValue] = React.useState(0);

  const [documents, setDocuments] = useState([])
  const [printAnchor, setPrintAnchor] = useState(null)

  const getRow = () => {
    props.loading(true)
    setLoading(true)
    query({
      ref: ["=", props.router.query.ref],
      ...(props.filter || {}),
      _token: props.token
    },
      (res) => {

        const row = res.data.rows[0]

        setRow(row)

        if (props.getRow) props.getRow(res.data.rows[0])

        let notFound = false

        if (props.model && row.model != props.model) notFound = true

        if (props.restrict) {
          for (const [key, value] of Object.entries(props.restrict)) {
            if (row[key] != value) notFound = true
          }
        }

        setNotfound(notFound)

        props.loading(false)
        setLoading(false)
      },
      (err) => {
        console.log(err)
        props.loading(false)
        setLoading(false)
      })
  }

  const getDocuments = () => {
    if (props.restrict && props.restrict.type) {
      query({
        model: ["=", "document"],
        for: ["=", props.restrict.type],
        _token: props.token
      },
        (res) => {
          console.log("docs", res.data)
          setDocuments(res.data.rows)
        },
        (err) => {
          console.log(err)
        })
    }
  }

  useEffect(() => {
    getRow()
    getDocuments()
  }, [])


  const printRef = useRef()
  const [printContent, setPrintContent] = useState()

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  })

  useEffect(() => {
    if (printRef && printContent) handlePrint()
  }, [printContent])

  const replaceRefs = (content) => {
    let newContent = content.replace(/([\[(])(.+?)([\])])/g,
      (match, p1, p2, p3, offset, string) => {
        console.log(p2)
        if (p2.includes("YYYY") && p2.includes("MM") && p2.includes("DD")) {
          return moment(new Date()).format(p2)
        }
        else if (p2.includes(":")) {
          let split = p2.split(":")
          let field = fields.filter(f =>
            f.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") == split[0]
          )[0] || {}
          return row[field.id + "_data"] ? row[field.id + "_data"][split[1]] : p1 + p2 + p3
        }
        let field = fields.filter(f =>
          f.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") == p2
        )[0] || {}
        return row[field.id] ? row[field.id] : p1 + p2 + p3
      });

    return newContent
  }

  return !loading ? <>
    {row.id && !notFound ? <>
      {props.entries({
        ...props,
        onlyFields: true,
        returnFields: (fields) => {
          setFields(fields)
        }
      })}
      {openEditor &&
        props.entries({
          ...props,
          onlyEntries: true,
          entriesProps: {
            id: row.id,
            onClose: () => {
              setOpenEditor(false)
            },
            updated: () => {
              getRow()
              setOpenEditor(false)
            },
            deleted: () => {
              router.psuh("/")
            }
          }
        })
      }
      <Paper classes={{ root: classes.header }}>
        {props.header && <div className="flex flex-wrap border-b border-gray-400 p-2">
          {props.header.photo &&
            <div className="p-3">
              <Paper>
                <img src={row.photo} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
              </Paper>
            </div>
          }
          <div className="p-3">
            {props.header.content(row)}
          </div>
          <div className="flex-grow">
          </div>
          <div className="p-1">
            {props.user.role == "admin" &&
              <div className="p-2">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenEditor(true)}
                >
                  {__("Modifier")}
                </Button>
              </div>
            }
            {documents.length > 0 &&
              <div className="p-2">
                <Button
                  variant="contained"
                  color="default"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={(event) => setPrintAnchor(event.currentTarget)}
                >
                  {__("Imprimer")}
                </Button>
                <Menu
                  id="print-menu"
                  keepMounted
                  anchorEl={printAnchor}
                  open={Boolean(printAnchor)}
                  onClose={() => {
                    setPrintAnchor(null)
                  }}
                  PaperProps={{
                    style: {
                      maxHeight: 40 * 4.5,
                      width: 300,
                    },
                  }}
                >
                  {documents.map((document, index) =>
                    <MenuItem key={index} onClick={() => {
                      setPrintContent(replaceRefs(document.content))
                    }}>{document.title}</MenuItem>
                  )}
                </Menu>
              </div>
            }
          </div>
        </div>}
        <div className="">
          <Tabs
            value={value}
            indicatorColor="primary"
            textColor="primary"
            onChange={(event, newValue) => {
              setValue(newValue)
              if (props.onTabChange) props.onTabChange(newValue)
            }}
            aria-label="disabled tabs example"
          >
            {props.tabs.map((tab, index) =>
              <Tab key={index} label={__(tab.label)} />
            )}
          </Tabs>
        </div>
      </Paper>
      <div className="mt-5"></div>
      {props.tabs.map((tab, index) =>
        <TabPanel value={value} index={index} key={index}>
          {tab.content(row)}
        </TabPanel>
      )}
      <div style={{ width: "1px", height: "1px", overflow: "hidden" }}>
        <ComponentToPrint ref={printRef} content={printContent} />
      </div>
    </>
      : <>
        Not found
      </>}
  </> : <></>
}

class ComponentToPrint extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return <div className="entry-print"
      style={{ padding: "80px" }}
      dangerouslySetInnerHTML={{ __html: this.props.content }}></div>
  }
}
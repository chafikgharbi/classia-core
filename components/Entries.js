import React, { Component, useEffect, useState, useRef } from "react";
import server, { query } from "../library/api";
import { __ } from "../library/translation"
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Menu from '@material-ui/core/Menu';
import SelectRow from "./SelectRow"
import SelectRows from "./SelectRows"
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";
import FileUpload from "./FileUpload";
import numeral from "numeral"
import moment from "moment"
import { useReactToPrint } from 'react-to-print';
import { Editor } from '@tinymce/tinymce-react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import CircularProgress from '@material-ui/core/CircularProgress'

const HtmlEditor = (props) => {

  const [value, setValue] = useState("")

  useEffect(() => {
    if (props.value) {
      setValue(props.value)
    }
  }, [props.value])

  return <>{value !== "_undefined" && <Editor
    apiKey="8qv8e6fje498myfb2c8b6p85u9s3punvrh514askqn21d252"
    initialValue={value}
    init={{
      height: 500,
      menubar: false,
      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount',
        'table'
      ],
      toolbar:
        'undo redo | fontselect  fontsizeselect | bold italic underline forecolor backcolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | removeformat |  \
        table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | \
        help',
      fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt' +
        ' 24pt 26pt 28pt 30pt 32pt 36pt',
      content_style: "body {padding: 80px}"
    }}
    onEditorChange={(content, editor) => {
      props.onChange(content)
    }}
  />
  }
  </>
}

export default function Entries(props) {

  const [fields, setFields] = useState(props.entry.fields)

  useEffect(() => {
    let _fields = []
    props.entry.fields.map(field => {
      _fields.push(field)
    })

    if (props.override && props.override.fields) {
      props.override.fields.map(field => {

        if (_fields.filter(f => f.id == field.id)[0]) {
          _fields = _fields.map(f => {
            return f.id == field.id ? { ...f, ...field } : f
          })
        } else {
          _fields.push(field)
        }

      })
    }

    setFields(_fields)

  }, [props.entry, props.override])

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false)

  const [refreshSelect, setRefreshSelect] = useState({})
  const [currentSelect, setCurrentSelect] = useState(null)
  const [data, setData] = useState({})

  const [storedRows, setStoredRows] = useState({})

  const [currentSubjects, setCurrentSubjects] = useState([])

  useEffect(() => {
    if (props.state.levels) {
      let subjects = []
      let level = props.state.levels.filter(l => l.id == data.level)[0]
      if (level) {
        level.subjects.map(ls => {
          let subject = props.state.subjects.filter(s => s.id == ls.id)[0]
          if (subject && subject.id) subjects.push(subject)
        })
        setCurrentSubjects(subjects)
      }
    }
  }, [data.level])

  useEffect(() => {
    fields.map(field => {
      if (field.depends && field.depends.split(".").length > 1) {
        let split = field.depends.split(".")
        if (!data[field.id] && storedRows[split[0]]) {
          setValue(field.id, storedRows[split[0]][split[1]], field.type)
        }
      }
    })
  }, [storedRows])


  const [manageModel, setManageModel] = useState(null)
  const openManageModel = Boolean(manageModel)

  const setDataValue = (id, value) => {
    let newData = data
    newData[id] = value
    setData({ ...newData })
  }

  const setValue = (id, value, type = "text") => {
    if (type == "html") {
      setDataValue(id, "_undefined")
      setTimeout(() => {
        setDataValue(id, value)
      }, 1)
    } else {
      setDataValue(id, value)
    }
  }

  const calcSums = (string) => {
    var matches = string.match(/sum\(([^)]+)\)/);
    if (matches && matches[1]) {
      let split = matches[1].split(".")
      if (split[0].length > 1) {
        let sum = 0
        let values = data[split[0]] || []
        values.map(item => {
          sum += parseFloat(item[split[1]])
        })
        let newString = string.replace(`sum(${matches[1]})`, sum)
        return calcSums(newString)
      } else {
        return string
      }
    } else {
      return string
    }
  }

  useEffect(() => {
    fields.map(field => {
      if (field.calc) {
        let evalString = field.calc

        // sums
        evalString = calcSums(evalString)

        fields.map(f => {
          if (evalString.includes(f.id)) {
            evalString = evalString.replace(new RegExp(`{${f.id}}`, "g"), (data[f.id] || 0));
          }
        })
        let value = eval(evalString)
        if (value && data[field.id] != value)
          setValue(field.id, eval(evalString), field.type)
      }
    })
  }, [data])

  const setDefaults = () => {
    fields.map(field => {
      if (field.default) {
        setValue(field.id,
          field.type == "datetime" ?
            moment(field.default).format('YYYY-MM-DD HH:mm:ss') :
            field.type == "date" ?
              moment(field.default).format('YYYY-MM-DD') :
              field.default
        )
      }
    })
    if (props.entry.predefined) {
      for (const [key, value] of Object.entries(props.entry.predefined)) {
        // todo: add html type case (third arg) - for each "set predefined"
        setValue(key, value)
      }
    }
    if (props.override && props.override.predefined) {
      for (const [key, value] of Object.entries(props.override.predefined)) {
        setValue(key, value)
      }
    }
  }

  useEffect(() => {
    props.loading(true)
    if (props.id) {
      query({
        id: ["=", props.id],
        _token: props.token
      },
        res => {
          const row = res.data.rows[0]
          let rowData = JSON.parse(row.data || "{}")

          for (const [key, value] of Object.entries(rowData)) {
            setValue(key, value)
          }

          // Set defaults
          fields.map(field => {
            if (field.id == "ref") {
              setValue("ref", row.ref)
            }
            if (rowData[field.id]) {
              setValue(field.id, rowData[field.id], field.type)
            } else if (field.default) {
              setValue(field.id, field.default, field.type)
            }
          })

          // Set predefined
          if (props.entry.predefined) {
            for (const [key, value] of Object.entries(props.entry.predefined)) {
              if (!rowData[key]) setValue(key, value)
            }
          }
          if (props.override && props.override.predefined) {
            for (const [key, value] of Object.entries(props.override.predefined)) {
              if (!rowData[key]) setValue(key, value)
            }
          }

          props.loading(false)
        },
        error => {
          console.log(error);
          props.loading(false)
        }
      )
    } else {
      props.loading(false)
      setDefaults()
    }
  }, [])

  const [access, setAccess] = useState(null)

  useEffect(() => {
    if (props.id) {
      fields.map(field => {
        // If fields has password that means it is made for access
        if (field.type == "password") {
          checkAccess(props.id)
        }
      })
    } else {
      setAccess(false)
    }
  }, [])

  const checkAccess = (id) => {
    server({
      method: "get",
      url: "/rows/getAccess/" + id,
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        console.log("access", res.data)
        if (res.data.email) {
          setAccess(true)
        } else {
          setAccess(false)
        }
      })
      .catch(error => {
        console.log(error);
        setAccess(false)
      });
  }

  const deleteAccess = () => {
    if (confirm(
      `Voulez-vous supprimer l'accès de ${data.first_name ? data.first_name : data.email} ?`
    )) {
      setAccess(null)
      server({
        method: "post",
        url: "/rows/deleteAccess/" + props.id,
        headers: { authorization: "Bearer " + props.token }
      })
        .then(res => {
          setAccess(false)
        })
        .catch(error => {
          console.log(error);
          setAccess(true)
        });
    }
  }

  const sanitizeData = () => {
    let newData = data

    /* Todo: this part is commented to avoid erase important data
     * due to multiple entries for the same model
     */

    /*for (const [key, value] of Object.entries(newData)) {
      if (
        (fields && fields.filter(f => f.id == key)[0]) ||
        (props.entry.predefined && props.entry.predefined.filter(p => p.id == key)[0]) ||
        ["auth_id"].includes(key)
      ) {
        // Do nothing
      } else {
        delete newData[key]
      }
    }*/

    return newData
  }

  const create = () => {
    props.loading(true)
    server({
      method: "post",
      url: "/rows/create",
      data: {
        model: props.model,
        data: data
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        props.loading(false)
        setValue("ref", res.data.inserted.insertRef)
        if (props.created) props.created(res.data.inserted.insertId)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  };

  const save = () => {
    if (!props.id) {
      create()
      return
    }
    props.loading(true)
    server({
      method: "post",
      url: "/rows/update/" + props.id,
      data: {
        model: props.model,
        data: sanitizeData()
      },
      headers: { authorization: "Bearer " + props.token }
    })
      .then(res => {
        props.loading(false)
        if (props.updated) props.updated(props.id)
      })
      .catch(error => {
        console.log(error);
        props.loading(false)
      });
  };

  const _delete = () => {
    if (confirm("Voulez-vous supprimer cette note?")) {
      props.loading(true)
      server({
        method: "post",
        url: "/rows/delete/" + props.id,
        headers: { authorization: "Bearer " + props.token }
      })
        .then(res => {
          props.loading(false)
          props.deleted(props.id)
        })
        .catch(error => {
          console.log(error);
          props.loading(false)
        });
    }
  };

  const getField = (field, val, onChange, fieldProps = {}) => {

    const formatNumber = (value) => {
      const stringValue = value.toString()
      if (stringValue.slice(-1) == ".") {
        if (!isNaN(stringValue.slice(0, -1))) {
          return parseInt(stringValue.slice(0, -1)) + "."
        } else {
          return 0
        }
      } else {
        return parseFloat(value)
      }
    }

    const getPriceValue = (id) => {
      if (data[id + "_currency"]) {
        return data[id + "_original"]
      } else {
        return data[id]
      }
    }

    switch (field.type) {
      case "row":
        return <div className="p-3" key={field.id}>
          <SelectRow
            {...fieldProps}
            refresh={refreshSelect[field.id]}
            model={field.model}
            filters={field.filters || []}
            label={__(field.name)}
            token={props.token}
            value={val}
            item={field.item}
            disabled={field.disabled || false}
            controls={[field.manage ? "manage" : ""]}
            onStore={(row) => {
              setStoredRows({ ...storedRows, [field.id]: row })
            }}
            onChange={(value) => {
              setValue(field.id, value)
            }}
            onManage={() => {
              setManageModel(field.manage)
              setCurrentSelect(field.id)
              let refSelect = refreshSelect
              refSelect[field.id] = false
              setRefreshSelect(refSelect)
            }}
          />
        </div>
      case "rows":
        return <div className="p-3" key={field.id}>
          <SelectRows
            {...fieldProps}
            refresh={refreshSelect[field.id]}
            model={field.model}
            filters={field.filters || []}
            label={__(field.name)}
            token={props.token}
            value={val}
            item={field.item}
            disabled={field.disabled || false}
            controls={[field.manage ? "manage" : ""]}
            onChange={(value) => {
              onChange(value)
            }}
            onManage={() => {
              setManageModel(field.manage)
              setCurrentSelect(field.id)
              let refSelect = refreshSelect
              refSelect[field.id] = false
              setRefreshSelect(refSelect)
            }}
          />
        </div>
      case "text":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            label={__(field.name)}
            variant="outlined"
            value={val}
            disabled={field.id == "ref" && props.id}
            onChange={e => onChange(e.target.value)} />
        </div>
      case "number":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            label={__(field.name)}
            variant="outlined"
            value={val}
            onChange={e =>
              onChange(formatNumber(e.target.value))
            } />
        </div>
      case "price":
        return <div className="flex p-2" key={field.id}>
          <div className="relative flex-grow p-1">
            <TextField
              {...fieldProps}
              className="w-full"
              label={__(field.name)}
              variant="outlined"
              value={numeral(data[field.id + "_currency"] && data[field.id + "_currency"] != props.tenant.currency ? data[field.id + "_original"] : data[field.id]).format('0,0[.]00')}
              onChange={e => {
                const eValue = e.target.value.replace(/,/g, '')
                if (data[field.id + "_currency"] && data[field.id + "_currency"] != props.tenant.currency) {
                  setValue(field.id + "_original", eValue)
                  setValue(field.id, eValue * parseFloat(props.tenant.exchange[data[field.id + "_currency"]]))
                } else {
                  setValue(field.id, eValue)
                  setValue(field.id + "_original", eValue)
                  setValue(field.id + "_currency", props.tenant.currency || "DA")
                }
              }
              } />
            {data[field.id + "_currency"] &&
              <div className="absolute text-base font-bold text-primary bottom-0 right-0 p-2 px-3"
                style={{ pointerEvents: "none", fontFamily: "monospace" }}>
                {numeral(data[field.id]).format('0,0[.]00')}
                {" "}{props.tenant.currency}
              </div>
            }
          </div>
          {props.tenant.multicur &&
            <div className="w-1/3 p-1">
              <FormControl variant="outlined" className="w-full">
                <InputLabel className="bg-white -mx-1" id={"label-" + field.id + "-currency"}>
                  &nbsp;{__("Devise")}&nbsp;
                </InputLabel>
                <Select
                  {...fieldProps}
                  labelId={"label-" + field.id + "-currency"}
                  id={"select-" + field.id + "-currency"}
                  value={data[field.id + "_currency"] || props.tenant.currency}
                  // todo make them all setValue this is no more reusable
                  onChange={e => {
                    setValue(field.id, 0)
                    setValue(field.id + "_currency", e.target.value)
                    setValue(field.id + "_original", 0)
                  }}
                  label={__("Devise")}
                >
                  <MenuItem value="">Défaut</MenuItem>
                  {props.state.currencies.map((c, index) => {
                    return <MenuItem key={index} value={c.id}>{c.name}</MenuItem>
                  })}
                </Select>
              </FormControl>
            </div>
          }
        </div>
      case "date":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            type="date"
            label={__(field.name)}
            variant="outlined"
            value={val ? moment(val).format('YYYY-MM-DD') : moment(new Date()).format('YYYY-MM-DD')}
            onChange={e => onChange(moment(e.target.value).format('YYYY-MM-DD'))} />
        </div>
      case "datetime":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            type="datetime-local"
            label={__(field.name)}
            variant="outlined"
            value={val ? moment(val).format('YYYY-MM-DDTHH:mm') : moment(new Date()).format('YYYY-MM-DDTHH:mm')}
            onChange={e => onChange(moment(e.target.value).format('YYYY-MM-DD HH:mm:ss'))} />
        </div>
      case "time":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            type="time"
            label={__(field.name)}
            variant="outlined"
            value={val || "00:00"}
            onChange={e => onChange(e.target.value)} />
        </div>
      case "email":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            type="email"
            autoComplete="new-password"
            label={__(field.name)}
            variant="outlined"
            value={val}
            onChange={e => onChange(e.target.value)} />
        </div>
      case "password":
        return <div className="p-3" key={field.id}>
          <TextField
            {...fieldProps}
            className="w-full"
            type="password"
            autoComplete="new-password"
            label={__(field.name)}
            variant="outlined"
            disabled={access === null}
            value={access && !val ? "000000" : val}
            onChange={e => onChange(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  {access === null &&
                    <CircularProgress size={20} className="ml-2" />
                  }
                  {access &&
                    <IconButton
                      onClick={deleteAccess}>
                      <CloseIcon />
                    </IconButton>
                  }
                </InputAdornment>
              ),
            }}
          />
        </div>
      case "select":
        return <div className="p-3" key={field.id}>
          <FormControl variant="outlined" className="w-full">
            <InputLabel className="bg-white -mx-1" id={"label-" + field.id}>
              &nbsp;{__(field.name)}&nbsp;
            </InputLabel>
            <Select
              {...fieldProps}
              labelId={"label-" + field.id}
              id={"select-" + field.id}
              value={val}
              onChange={e => onChange(e.target.value)}
              label={__(field.name)}
            >
              {field.options.map((option, index) => {
                return <MenuItem key={index} value={option.value}>{__(option.name)}</MenuItem>
              })}
            </Select>
          </FormControl>
        </div>
      case "level":
        return <div className="p-3" key={field.id}>
          <FormControl variant="outlined" className="w-full">
            <InputLabel className="bg-white -mx-1" id={"label-" + field.id}>
              &nbsp;{__(field.name)}&nbsp;
            </InputLabel>
            <Select
              {...fieldProps}
              labelId={"label-" + field.id}
              id={"select-" + field.id}
              value={val}
              onChange={e => onChange(e.target.value)}
              label={__(field.name)}
            >
              <MenuItem value="">{__("Sélectionnez ...")}</MenuItem>
              {(props.state.levels || []).map((level, index) => {
                return <MenuItem key={index} value={level.id}>
                  {props.state.lang == "ar" ? level.name_ar : level.name}
                </MenuItem>
              })}
            </Select>
          </FormControl>
        </div>
      case "subject":
        return <div className="p-3" key={field.id}>
          <FormControl variant="outlined" className="w-full">
            <InputLabel className="bg-white -mx-1" id={"label-" + field.id}>
              &nbsp;{__(field.name)}&nbsp;
            </InputLabel>
            <Select
              {...fieldProps}
              labelId={"label-" + field.id}
              id={"select-" + field.id}
              value={val}
              onChange={e => onChange(e.target.value)}
              label={__(field.name)}
            >
              <MenuItem value="">{__("Sélectionnez ...")}</MenuItem>
              {(field.depends ? currentSubjects : props.state.subjects).map((subject, index) => {
                return <MenuItem key={index} value={subject.id}>
                  {props.state.lang == "ar" ? subject.name_ar : subject.name}
                </MenuItem>
              })}
            </Select>
          </FormControl>
        </div>
      case "image":
        return <div className="p-3" key={field.id}>
          <ImageUpload
            data={data}
            field={field.id}
            id={props.id}
            token={props.token}
            loading={props.loading}
            className="w-full"
            label={__(field.name)}
            value={val}
            model={props.model}
            createdId={(id, ref) => {
              setValue("ref", ref)
              props.createdId(id)
            }}
            onChange={value => onChange(value)} />
        </div>
      case "file":
        return <div className="p-3" key={field.id}>
          <FileUpload
            data={data}
            field={field.id}
            id={props.id}
            token={props.token}
            loading={props.loading}
            className="w-full"
            label={__(field.name)}
            value={val}
            model={props.model}
            createdId={(id, ref) => {
              setValue("ref", ref)
              props.createdId(id)
            }}
            onChange={value => onChange(value)} />
        </div>
      case "video":
        return <div className="p-3" key={field.id}>
          <VideoUpload
            data={data}
            field={field.id}
            id={props.id}
            token={props.token}
            loading={props.loading}
            className="w-full"
            label={__(field.name)}
            value={val}
            model={props.model}
            createdId={(id, ref) => {
              setValue("ref", ref)
              props.createdId(id)
            }}
            onChange={value => onChange(value)} />
        </div>
      case "html":
        return <div className="p-3 w-full" key={field.id}>
          {/*<div onClick={() => {
            setValue(field.id, `<img src="${props.tenant.logo}" width="100" height="100" /> ${val}`, field.type)
          }}>Cadre</div>*/}
          <HtmlEditor
            value={val}
            onChange={content => {
              onChange(content)
            }}
          />
        </div>
    }
  }

  const printRef = useRef()
  const [printContent, setPrintContent] = useState()

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  })

  useEffect(() => {
    if (printRef && printContent) handlePrint()
  }, [printContent])

  return (
    <>
      {openManageModel &&
        <>
          <Dialog open={true} onClose={() => setManageModel(null)} maxWidth="xl" aria-labelledby="form-dialog-title">
            <DialogContent>
              <div className="-m-5">{manageModel && manageModel}</div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManageModel(null)} color="primary">
                Annuler
          </Button>
              <Button onClick={() => {
                let refSelect = refreshSelect
                refSelect[currentSelect] = true
                setRefreshSelect(refSelect)
                setManageModel(null)
              }} color="primary">
                Terminer
          </Button>
            </DialogActions>
          </Dialog>
        </>
      }
      <Dialog open={true} onClose={props.onClose} maxWidth="xl" aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">
          <div className="flex items-center justify-between -mt-2" style={{ minWidth: "320px" }}>
            <div>{props.id ? __("Modifier les informations") : __("Entrer les informations")}</div>
            <div className="-mx-4">
              <IconButton aria-label="Ajouter" onClick={(event) => {
                setAnchorEl(event.currentTarget);
                setMenuOpen(true)
              }} >
                <FontAwesomeIcon icon={faBars} style={{ width: "15px" }} className="text-base text-gray-600" />
              </IconButton>
              <IconButton aria-label="Ajouter" onClick={props.onClose} >
                <CloseIcon />
              </IconButton>
              <Menu
                id="long-menu"
                keepMounted
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => {
                  setAnchorEl(null)
                  setMenuOpen(false)
                }}
                PaperProps={{
                  style: {
                    maxHeight: 40 * 4.5,
                    width: '20ch',
                  },
                }}
              >
                {props.entry.controls && props.entry.controls.map((control, index) =>
                  (!control.for || control.for == "entry") &&
                  (!control.if || (control.if && data[control.if.key] == control.if.value)) &&
                  <MenuItem key={index} onClick={() => {
                    if (control.type == "print") {
                      setPrintContent(control.template({ ...data, _rows: storedRows }))
                    }
                    if (control.type == "edit") {
                      setValue(control.data.key, control.data.value)
                    }
                  }}>{control.name}</MenuItem>
                )}
                {props.id && <MenuItem onClick={_delete}>{__("Supprimer")}</MenuItem>}
                <MenuItem onClick={props.onClose}>{__("Fermer")}</MenuItem>
              </Menu>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="sm:flex -m-5 -my-2">
            <div className="flex-grow" style={{ minWidth: "300px", maxWidth: "100%" }}>
              {fields.map((field) => {
                if (!field.pos || field.pos == 1) {
                  return getField(field, (data[field.id] || ""), (value) => {
                    setValue(field.id, value)
                  })
                }
              })}
            </div>

            {fields.filter(f => f.pos == 2).length > 0 &&
              <div className="flex-grow" style={{ width: "300px" }}>
                {fields.map((field) => {
                  if (field.pos == 2) {
                    return getField(field, (data[field.id] || ""), (value) => {
                      setValue(field.id, value)
                    })
                  }
                })}
              </div>
            }

            {fields.filter(f => f.pos == 3).length > 0 &&
              <div className="flex-grow" style={{ width: "300px" }}>
                {fields.map((field) => {
                  if (field.pos == 3) {
                    return getField(field, (data[field.id] || ""), (value) => {
                      setValue(field.id, value)
                    })
                  }
                })}
              </div>
            }

            {/*props.extra && props.extra.map((field, index) => {
              return <button key={index} onClick={() => {
                setPrintContent(field.template(data))
              }}>
                {field.name}
              </button>
            })*/}

            <div style={{ width: "1px", height: "1px", overflow: "hidden" }}>
              <ComponentToPrint ref={printRef} content={printContent} />
            </div>

          </div>

        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            {__("Annuler")}
          </Button>
          <Button onClick={save} color="primary">
            {__("Enregistrer")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

class ComponentToPrint extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return <div>{this.props.content}</div>
  }
}
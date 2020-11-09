import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle, faFilter, faCloudDownloadAlt, faUpload } from '@fortawesome/free-solid-svg-icons'
import { __ } from "../library/translation"

import SelectRow from "./SelectRow"
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Importer from "./Importer"

export default function PageHeader(props) {

  const [filterFields, setfilterFields] = useState([])

  useEffect(() => {
    if (props.filterFields) {
      let _filterFields = props.filterFields
      if (props.override && props.override.removeFilterFields) {
        props.override.removeFilterFields.map(field => {
          //delete _filterFields[field]
          console.log("ff", _filterFields)
          _filterFields = _filterFields.filter(f => f.selector != field)
        })
      }
      setfilterFields(_filterFields)
    }
  }, [props.filterFields, props.override])

  const [filtersMenu, setFiltersMenu] = useState(null)

  const [values, setValues] = useState({})

  const [currentSubjects, setCurrentSubjects] = useState([])

  const [openImporter, setOpenImporter] = useState(false)

  useEffect(() => {
    if (values.level && values.level[1]) {
      let subjects = []
      let level = props.state.levels.filter(l => l.id == values.level[1])[0]
      if (level) {
        level.subjects.map(ls => {
          let subject = props.state.subjects.filter(s => s.id == ls.id)[0]
          if (subject && subject.id) subjects.push(subject)
        })
        setCurrentSubjects(subjects)
      }
    }
  }, [values.level])

  const updateValue = (key, value) => {
    let newValues = values
    newValues[key] = ["=", value]
    setValues(newValues)
    props.setFilters(values)
  }

  const getValue = (key) => {
    return values[key] && values[key][1] ? values[key][1] : ""
  }

  const setDefaults = () => {
    let newValues = values
    let doFilter = false
    filterFields.map(field => {
      if (field.default && field.default != "") {
        newValues[field.selector] = ["=", field.default]
        doFilter = true
      }
      if (doFilter) {
        setValues(newValues)
        props.setFilters(newValues)
      }
    })
  }

  useEffect(() => {
    if (props.globals) {
      let newFilters = {}
      for (const [key, value] of Object.entries(props.globals)) {
        newFilters[key] = ["=", value]
      }
      //props.setFilters(newFilters)
    }
  }, [props.globals])

  useEffect(() => {
    if (filterFields) {
      setDefaults()
    }
  }, [])

  return (
    <>
      {openImporter && <Importer  {...props} onClose={() => setOpenImporter(false)} />}
      <div className="flex flex-wrap justify-between items-center p-3 px-4 -my-1 text-sm">
        <div className="font-normal text-xl p-2">{props.title}</div>
        {(filterFields || (props.actions && props.actions.length > 0 && props.actions.includes("add"))) &&
          <div className="flex items-center p-2 -m-2">
            <div className="p-2" className="text-gray-800">
              {props.actions && props.actions.includes("import") &&
                <IconButton aria-label="Importer" onClick={() => setOpenImporter(true)} >
                  <FontAwesomeIcon icon={faUpload} className="text-base" />
                </IconButton>
              }
              {props.actions && props.actions.includes("export") &&
                <IconButton aria-label="Exporter" onClick={() => { }} >
                  <FontAwesomeIcon icon={faCloudDownloadAlt} className="text-base" />
                </IconButton>
              }
              {filterFields && filterFields.length > 0 &&
                <IconButton aria-label="Filtrer" onClick={(event) =>
                  setFiltersMenu(event.currentTarget)
                } >
                  <FontAwesomeIcon icon={faFilter} className="text-base" />
                </IconButton>
              }
              {props.actions && props.actions.includes("add") &&
                <IconButton aria-label="Ajouter" onClick={() => props.onAdd()} >
                  <FontAwesomeIcon icon={faPlusCircle} className="text-base" />
                </IconButton>
              }
            </div>
            <Menu
              id="long-menu"
              keepMounted
              anchorEl={filtersMenu}
              open={Boolean(filtersMenu)}
              onClose={() => {
                setFiltersMenu(null)
              }}
              PaperProps={{
                style: {
                },
              }}
            >
              {filterFields && filterFields.map((field, index) => {
                return <div key={index} className="p-2" style={{ minWidth: "300px" }}>
                  {field.type == "model" &&
                    <SelectRow
                      model={field.model}
                      filters={field.filters || []}
                      label={field.name}
                      token={props.token}
                      value={getValue(field.selector)}
                      item={field.item}
                      onChange={(value) => {
                        updateValue(field.selector, value)
                      }}
                    />
                  }
                  {field.type == "text" &&
                    <TextField
                      className="w-full"
                      label={__(field.name)}
                      variant="outlined"
                      value={getValue(field.selector)}
                      onChange={e => updateValue(field.selector, e.target.value)} />
                  }
                  {field.type == "select" &&
                    <FormControl variant="outlined" className="w-full">
                      <InputLabel className="bg-white -mx-1" id={"label-" + field.selector}>
                        &nbsp;{field.name}&nbsp;
                      </InputLabel>
                      <Select
                        labelId={"label-" + field.selector}
                        id={"select-" + field.selector}
                        value={getValue(field.selector)}
                        onChange={e =>
                          updateValue(field.selector, e.target.value)
                        }
                        label={field.name}
                      >
                        {field.options.map((option, index) => {
                          return <MenuItem key={index} value={option.value}>{option.name}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  }
                  {field.type == "level" &&
                    <FormControl variant="outlined" className="w-full">
                      <InputLabel className="bg-white -mx-1" id={"label-" + field.selector}>
                        &nbsp;Niveau&nbsp;
                      </InputLabel>
                      <Select
                        labelId={"label-" + field.selector}
                        id={"select-" + field.selector}
                        value={getValue(field.selector)}
                        onChange={event =>
                          updateValue(field.selector, event.target.value)}
                        label="Niveau"
                      >
                        <MenuItem value="">Tous les niveaux</MenuItem>
                        {props.state.levels.map((level, index) => {
                          return <MenuItem key={index} value={level.id}>{level.name}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  }
                  {field.type == "subject" &&
                    <FormControl variant="outlined" className="w-full">
                      <InputLabel className="bg-white -mx-1" id={"label-" + field.selector}>
                        &nbsp;Matière&nbsp;
                      </InputLabel>
                      <Select
                        labelId={"label-" + field.selector}
                        id={"select-" + field.selector}
                        value={getValue(field.selector)}
                        onChange={event =>
                          updateValue(field.selector, event.target.value)}
                        label="Matière"
                      >
                        <MenuItem value="">Tous les matières</MenuItem>
                        {(field.depends ? currentSubjects : props.state.subjects).map((subject, index) => {
                          return <MenuItem key={index} value={subject.id}>{subject.name}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  }
                  {field.type == "trim" &&
                    <select
                      className="bg-gray-100 py-2 px-3 w-full rounded-lg"
                      style={{ height: "34px" }}
                      value={getValue(field.selector)}
                      onChange={event => {
                        updateValue(field.selector, event.target.value)
                      }}
                    >
                      <option value="">{__("Tous les trimèstres")}</option>
                      <option value="1">{__("1er trimèstre")}</option>
                      <option value="2">{__("2ème trimèstre")}</option>
                      <option value="3">{__("3ème trimèstre")}</option>
                    </select>
                  }
                </div>
              })}
            </Menu>
          </div>
        }
      </div>
    </>
  );
}
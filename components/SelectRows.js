import React, { useEffect, useState } from "react";
import { query } from "../library/api";
import { __ } from "../library/translation"
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ListIcon from '@material-ui/icons/List';

export default function SelectRows(props) {

  const [list, setList] = useState([])

  const [value, setValue] = useState([])

  useEffect(() => {
    if (props.refresh) {
      getList()
    }
  }, [props.refresh])

  useEffect(() => {
    let values = (props.value || "").split(",")
    let exist = true
    values.map(value => {
      let checkValue = list.filter(item => item.ref == value)
      if (checkValue.length < 1) {
        exist = false
      }
    })
    if (exist) {
      setSelectedValues(list, props.value)
    } else {
      console.log("getList")
      getList()
    }
  }, [props.value])

  // todo sanitize comma , on saving ref in entries
  const setSelectedValues = (list, refs) => {
    let items = (refs || "").split(",")
    setValue(list.filter(c => items.includes(c.ref.toString())))
  }

  const getList = () => {
    query({
      model: ["=", props.model],
      ...(props.filters || []),
      _start: 0,
      _limit: 1000,
      _token: props.token
    },
      res => {
        setList(res.data.rows)
        setSelectedValues(res.data.rows, props.value)
      },
      err => {
        console.log(err);
      }
    )
  }

  return (
    <Autocomplete
      multiple
      autoHighlight
      openOnFocus
      options={list}
      getOptionLabel={(option) => props.item(option)}
      renderOption={(option) => props.item(option)}
      value={value || []}
      getOptionSelected={(option, value) => option.ref == value.ref}
      disabled={props.disabled}
      onChange={(event, newValue) => {
        setValue(newValue)
        let string = ""
        newValue.map(item => {
          string += item.ref + ","
        })
        props.onChange(string.slice(0, -1))
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.label}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {props.controls && props.controls.includes("manage") &&
                  <ListIcon onClick={props.onManage}
                    className="cursor-pointer text-gray-700" />
                }
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )
      }
    />
  );
}
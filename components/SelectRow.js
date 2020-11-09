import React, { useEffect, useState } from "react";
import server, { query } from "../library/api";
import { __ } from "../library/translation"
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ListIcon from '@material-ui/icons/List';

export default function SelectRow(props) {

  const [list, setList] = useState([])

  const [value, setValue] = useState(null)

  useEffect(() => {
    if (props.refresh) {
      getList()
    }
  }, [props.refresh])

  useEffect(() => {
    let checkValue = list.filter(item => item.ref == props.value)
    if (checkValue.length > 0) {
      setSelectedValue(list, props.value)
    } else {
      getList()
    }
  }, [props.value])

  const setSelectedValue = (list, ref) => {
    let selectedValue = list.filter(item => item.ref == ref)
    setValue(selectedValue ? selectedValue[0] : "")
    if (props.onStore) props.onStore(selectedValue ? selectedValue[0] : {})
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
        setSelectedValue(res.data.rows, props.value)
      },
      err => {
        console.log(err);
      }
    )
  }

  return (
    <Autocomplete
      //filterOptions={filterOptions}
      autoHighlight
      openOnFocus
      options={list}
      getOptionLabel={(option) => props.item(option)}
      renderOption={(option) => props.item(option)}
      disabled={props.disabled}
      value={value || null}
      onChange={(event, newValue) => {
        setValue(newValue)
        if (props.onStore) props.onStore(newValue ? newValue : {})
        props.onChange(newValue ? newValue.ref : "")
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.label}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            disabled: props.disabled,
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
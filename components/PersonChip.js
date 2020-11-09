import { useState, useEffect } from "react"
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import { __ } from "classia"

export default function PersonChip(props) {

  const [person, setPerson] = useState({})

  useEffect(() => {
    setPerson(props.selector ? props.row[props.selector + "_data"] || {} : props.row || {})
  }, [props.row])

  return <div style={{ pointerEvents: "none" }}>
    <Chip
      style={{ maxWidth: "200px" }}
      avatar={<Avatar alt={person.first_name} src={person.photo} />}
      label={
        person.last_name
          ? person.last_name
          + (person.first_name ? " " + person.first_name : "")
          : __("Indéfinie")
      }
      variant="outlined"
    />
  </div>
}